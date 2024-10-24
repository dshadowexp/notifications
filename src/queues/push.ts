import { QUEUE_NAMES } from './config';
import { NotificationQueue } from './base';
import { FirebaseMessagingProvider } from '../providers/firebase';

export class PushQueue extends NotificationQueue {
    constructor(pushConfig: any, concurrency?: number) {
        super(QUEUE_NAMES.PUSH, concurrency);
        this.provider = new FirebaseMessagingProvider(pushConfig);
    }
}