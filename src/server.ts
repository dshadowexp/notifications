import dotenv from 'dotenv';
const envFile = `.env.${process.env.NODE_ENV}`;

const result = dotenv.config({ path: envFile });
if (result.error) {
    logger.error("Error loading .env.development file:", result.error);
    process.exit(0);
} else {
    console.log(`.env.${process.env.NODE_ENV} file loaded successfully`);
}

import { Server } from 'http';
import express, { Application } from 'express';
import { v4 as uuidv4 } from 'uuid';
import config, { firebaseOptions, mailerOptions, twilioOptions } from './config';
import { errorsMiddleware, securityMiddleware, standardMiddleware } from './api/middlewares';
import { KafkaClient, KafkaConsumer } from '@tuller/lib';
import { SendNotificationConsumer } from './consumers/consumeSendNotification';
import { NotificationQueueManager } from './queues/manager';
import { IdempotencyService } from './services/idempotency';
import { UserDataRepository } from './repository/userData';
import { CreateNotificationUserDataConsumer, UpdateNotificationUserDataConsumer } from './consumers/consumeUserData';
import { initializeRoutes } from './api/routes';
import { startRedis } from './db/redis';
import { disconnectPrisma } from './db/postgres';
import { logger } from './lib/utils';

KafkaClient.getInstance().initialize(config.APP_ID, [ config.KAFKA_BROKER ]);

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
        logger.info(`${config.APP_ID} on 127.0.0.1:${config.API_PORT} on process: ${process.pid}`);
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
    const consumer = new KafkaConsumer(KafkaClient.getInstance().client, `${config.APP_ID}-consumer-${uuidv4()}`);

    const notificationUserDataRepository = new UserDataRepository()

    await consumer.subscribe(
        new SendNotificationConsumer(
            notificationQueueManager, 
            idempotencyService, 
            notificationUserDataRepository
        )
    );

    await consumer.subscribe(
        new CreateNotificationUserDataConsumer(
            notificationUserDataRepository
        )
    );

    await consumer.subscribe(
        new UpdateNotificationUserDataConsumer(
            notificationUserDataRepository
        )
    );

    await consumer.consumeMessages();

    return consumer;
}

/**
 * 
 */
async function startServer() {
    const redis = startRedis();

    const idempotencyService = new IdempotencyService(redis);

    const queueManager = await startQueueManager();

    const app = startApp();

    startHttpServer(app);

    const kafkaConsumer = await startKafka(queueManager, idempotencyService);

    const idempotencyCleanupTimer = setInterval(() => {
        idempotencyService.cleanup().catch(console.error);
    }, 60 * 60 * 1000); 

    const signals = ["SIGINT", "SIGTERM", "SIGQUIT"] as const;
    signals.forEach((signal) => {
        process.on(signal, async () => {
            await kafkaConsumer.destroy();
            await queueManager.closeAll();
            await redis.quit();
            await disconnectPrisma();
            clearInterval(idempotencyCleanupTimer)
            process.exit(0);
        });
    });
}

startServer();