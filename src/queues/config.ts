import { QueueOptions } from 'bullmq';
import config from '../config';

export const QUEUE_NAMES = {
    PUSH: 'push-notifications',
    EMAIL: 'email-notifications',
    SMS: 'sms-notifications'
} as const;

const REDIS_QUEUE_CONFIG = {
    host: config.REDIS_URI,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
}

export const DEFAULT_QUEUE_CONFIG: QueueOptions = {
    connection: REDIS_QUEUE_CONFIG,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
};