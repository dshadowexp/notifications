import { QUEUE_NAMES } from './config';
import { NotificationQueue } from './base';
import { TwilioConfig, TwilioProvider } from '../providers/twilio';

export class SMSQueue extends NotificationQueue {
    constructor(smsConfig: Omit<TwilioConfig, 'whatsappFromNumber'>, concurrency?: number) {
        super(QUEUE_NAMES.SMS, concurrency, new TwilioProvider(smsConfig));
    }
}