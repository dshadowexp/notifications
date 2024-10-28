import { QUEUE_NAMES } from './config';
import { NotificationQueue } from './base';
import { TwilioConfig, TwilioProvider } from '../providers/twilio';

export class WhatsAppQueue extends NotificationQueue {
    constructor(whatsappConfig: Omit<TwilioConfig, 'smsFromNumber'>, concurrency?: number) {
        super(QUEUE_NAMES.WHATSAPP, concurrency, new TwilioProvider(whatsappConfig));
    }
}