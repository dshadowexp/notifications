import { QUEUE_NAMES } from './config';
import { NotificationQueue } from './base';
import { FirebaseMessagingClient } from '../clients/firebase';

export class PushQueue extends NotificationQueue {
    constructor(pushConfig: any, concurrency?: number) {
        super(QUEUE_NAMES.PUSH, concurrency);
        this.client = new FirebaseMessagingClient(pushConfig);
    }

    protected async initializeClient(): Promise<void> {
        await this.client!.initialize();
    }
}