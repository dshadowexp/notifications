import { Job } from 'bullmq';
import { PushQueue } from './push';
import { EmailQueue } from './email';
import { SMSQueue } from './sms';
import { WhatsAppQueue } from './whatsapp';
import { QueueJobData } from '../types/notifications';


export class NotificationQueueManager {
    private pushQueue?: PushQueue;
    private emailQueue?: EmailQueue;
    private smsQueue?: SMSQueue;
    private whatsappQueue?: WhatsAppQueue;

    constructor(
        private readonly config: {
            push?: any;
            email?: any;
            sms?: any;
            whatsapp?: any;
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

        if (this.config.whatsapp) {
            this.whatsappQueue = new WhatsAppQueue(this.config.whatsapp);
            await this.whatsappQueue.initialize();
        }
    }

    async addPushNotification(data: QueueJobData): Promise<Job | undefined> {
        if (!this.pushQueue) {
            throw new Error('Push queue not initialized');
        }
        return this.pushQueue.addJob(data);
    }

    async addEmailNotification(data: QueueJobData): Promise<Job | undefined> {
        if (!this.emailQueue) {
            throw new Error('Email queue not initialized');
        }
        return this.emailQueue.addJob(data);
    }

    async addSMSNotification(data: QueueJobData): Promise<Job | undefined> {
        if (!this.smsQueue) {
            throw new Error('SMS queue not initialized');
        }
        return this.smsQueue.addJob(data);
    }

    async addWhatsappNotification(data: QueueJobData): Promise<Job | undefined> {
        if (!this.whatsappQueue) {
            throw new Error('Whatsapp queue not initialized');
        }
        data.payload.to = `whatsapp:${data.payload.to}`;
        return this.whatsappQueue.addJob(data);
    }

    async closeAll(): Promise<void> {
        await Promise.all([
            this.pushQueue?.close(),
            this.emailQueue?.close(),
            this.smsQueue?.close(),
            this.whatsappQueue?.close(),
        ]);
    }
}