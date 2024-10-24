import { QUEUE_NAMES } from './config';
import { NotificationQueue } from './base';
import { MailerConfig, MailerProvider } from '../providers/mailer';

export class EmailQueue extends NotificationQueue {
    constructor(mailerConfig: MailerConfig, concurrency?: number) {
        super(QUEUE_NAMES.EMAIL, concurrency);
        this.provider = new MailerProvider(mailerConfig);
    }
}