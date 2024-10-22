import dotenv from 'dotenv';
dotenv.config();

import { Server } from 'http';
import express, { Application } from 'express';

import config, { firebaseOptions, mailerOptions, twilioOptions } from './config';
import { errorsMiddleware, securityMiddleware, standardMiddleware } from './api/middlewares';
import { KafkaService } from '@tuller/lib';
import { SendNotificationConsumer } from './consumers/consumeSendNotification';
import { NotificationQueueManager } from './queues/manager';
import { IdempotencyService } from './services/idempotency';
import { UserDataRepository } from './repository/userData';
import { CreateNotificationUserDataConsumer, UpdateNotificationUserDataConsumer } from './consumers/consumeUserData';
import { initializeRoutes } from './api/routes';
import { startRedis } from './db/redis';
import { disconnectPrisma } from './db/postgres';


/**
 * Initializes the Express application with security, standard, routing, and error handling middleware.
 * 
 * @returns
 */
function startApp() {
    const app = express();
    securityMiddleware(app);
    standardMiddleware(app);
    initializeRoutes(app);
    errorsMiddleware(app);
    return app;
}

/**
 * 
 * 
 */
function startHttpServer(app: Application) {
    const httpServer: Server = new Server(app);
    httpServer.listen(config.API_PORT, () => {
        console.log(`${config.APP_ID} on 127.0.0.1:${config.API_PORT} on process: ${process.pid}`);
    });
}

/**
 * 
 * @returns 
 */
async function startQueueManager() {
    const manager = new NotificationQueueManager({
        push: firebaseOptions,
        email: mailerOptions,
        sms: twilioOptions
    });
    
    await manager.initialize();
    return manager;
}

/**
 * 
 * @param notificationQueueManager 
 * @returns 
 */
async function startKafka(
    notificationQueueManager: NotificationQueueManager,
    idempotencyService: IdempotencyService
) {
    const kafkaService = new KafkaService(config.APP_ID, [ config.KAFKA_BROKER ]);

    await kafkaService.createConsumer(`process-${config.APP_ID}-${Math.round(9)}`);

    const notificationUserDataRepository = new UserDataRepository()

    await (new SendNotificationConsumer(
        notificationQueueManager, 
        idempotencyService, 
        notificationUserDataRepository
    )).listen(kafkaService.subscribe);

    await (new CreateNotificationUserDataConsumer(
        notificationUserDataRepository
    )).listen(kafkaService.subscribe);

    await (new UpdateNotificationUserDataConsumer(
        notificationUserDataRepository
    )).listen(kafkaService.subscribe);

    return kafkaService;
}

/**
 * 
 */
async function startServer() {
    const redis = startRedis();

    const idempotencyService = new IdempotencyService(redis);

    const queueManager = await startQueueManager();

    const kafka = await startKafka(queueManager, idempotencyService);

    const app = startApp();

    startHttpServer(app);

    await kafka.consumeMessages();

    const idempotencyCleanupTimer = setInterval(() => {
        idempotencyService.cleanup().catch(console.error);
    }, 60 * 60 * 1000); 

    const signals = ["SIGINT", "SIGTERM", "SIGQUIT"] as const;
    signals.forEach((signal) => {
        process.on(signal, async () => {
            await kafka.destroy();
            await queueManager.closeAll();
            await redis.quit();
            await disconnectPrisma();
            clearInterval(idempotencyCleanupTimer)
            process.exit(0);
        });
    });
}

startServer();