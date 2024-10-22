import { Job } from 'bullmq';
import { PushQueue } from './push';
import { EmailQueue } from './email';
import { SMSQueue } from './sms';
import { QueueJobData } from '../types/notifications';

export class NotificationQueueManager {
    private pushQueue?: PushQueue;
    private emailQueue?: EmailQueue;
    private smsQueue?: SMSQueue;

    constructor(
        private readonly config: {
            push?: any;
            email?: any;
            sms?: any;
        }
    ) {}

    async initialize(): Promise<void> {
        if (this.config.push) {
            this.pushQueue = new PushQueue(this.config.push);
            await this.pushQueue.initialize();
        }
        
        if (this.config.email) {
            this.emailQueue = new EmailQueue(this.config.email);
            await this.emailQueue.initialize();
        }
        
        if (this.config.sms) {
            this.smsQueue = new SMSQueue(this.config.sms);
            await this.smsQueue.initialize();
        }
    }

    async addPushNotification(data: QueueJobData): Promise<Job | undefined> {
        if (!this.pushQueue) {
            throw new Error('Firebase queue not initialized');
        }
        return this.pushQueue.addJob(data);
    }

    async addEmailNotification(data: QueueJobData): Promise<Job | undefined> {
        if (!this.emailQueue) {
            throw new Error('Gmail queue not initialized');
        }
        return this.emailQueue.addJob(data);
    }

    async addSMSNotification(data: QueueJobData): Promise<Job | undefined> {
        if (!this.smsQueue) {
            throw new Error('Twilio queue not initialized');
        }
        return this.smsQueue.addJob(data);
    }

    async closeAll(): Promise<void> {
        await Promise.all([
            this.pushQueue?.close(),
            this.emailQueue?.close(),
            this.smsQueue?.close(),
        ]);
    }
}