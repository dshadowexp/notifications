import { QUEUE_NAMES } from './config';
import { NotificationQueue } from './base';
import { TwilioClient } from '../providers/twilio';

export class SMSQueue extends NotificationQueue {
    constructor(smsConfig: any, concurrency?: number) {
        super(QUEUE_NAMES.SMS, concurrency);
        this.client = new TwilioClient(smsConfig);
    }

    protected async initializeClient(): Promise<void> {
        await this.client!.initialize();
    }
}