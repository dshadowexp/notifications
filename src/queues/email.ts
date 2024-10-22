import { QUEUE_NAMES } from './config';
import { NotificationQueue } from './base';
import { MailerClient } from '../clients/mailer';

export class EmailQueue extends NotificationQueue {
    constructor(mailerConfig: any, concurrency?: number) {
        super(QUEUE_NAMES.EMAIL, concurrency);
        this.client = new MailerClient(mailerConfig);
    }

    protected async initializeClient(): Promise<void> {
        await this.client!.initialize();
    }
}