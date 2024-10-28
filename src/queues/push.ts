import { QUEUE_NAMES } from './config';
import { NotificationQueue } from './base';
import { FirebaseConfig, FirebaseMessagingProvider } from '../providers/firebase';

export class PushQueue extends NotificationQueue {
    constructor(pushConfig: FirebaseConfig, concurrency?: number) {
        super(QUEUE_NAMES.PUSH, concurrency, new FirebaseMessagingProvider(pushConfig));
    }
}