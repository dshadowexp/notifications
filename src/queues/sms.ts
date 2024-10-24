import { QUEUE_NAMES } from './config';
import { NotificationQueue } from './base';
import { TwilioProvider } from '../providers/twilio';

export class SMSQueue extends NotificationQueue {
    constructor(smsConfig: any, concurrency?: number) {
        super(QUEUE_NAMES.SMS, concurrency);
        this.provider = new TwilioProvider(smsConfig);
    }
}