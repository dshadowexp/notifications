import admin from 'firebase-admin';
import { Messaging } from 'firebase-admin/lib/messaging/messaging';
import { NotificationClient } from './base';
import { NotificationPayload, NotificationResponse } from '../types/notifications';

interface FirebaseConfig {
    projectId: string,
    clientEmail: string,
    privateKey: string
}

export class FirebaseMessagingClient extends NotificationClient {
    private messaging: Messaging | undefined;

    constructor(config: FirebaseConfig) {
        super(config);
    }

    async initialize(): Promise<void> {
        try {
            const app = admin.initializeApp({
                credential: admin.credential.cert(this.config),
            });

            this.messaging = app.messaging();
        } catch (error) {
            throw new Error(`Failed to initialize Firebase: ${error}`);
        }
    }

    validatePayload(payload: NotificationPayload): boolean {
        if (!payload.to) return false;
        if (!payload.body) return false;
        return true;
    }

    async send(payload: NotificationPayload): Promise<NotificationResponse> {
        try {
            if (!this.validatePayload(payload)) {
                throw new Error('Invalid payload');
            }
        
            const message = {
                notification: {
                    title: payload.title,
                    body: payload.body,
                },
                data: payload.data,
                token: Array.isArray(payload.to) ? payload.to[0] : payload.to,
            };
        
            const response = await this.messaging!.send(message);
            
            return {
                success: true,
                messageId: response
            };
        } catch (error) {
            return this.handleError(error);
        }
    }
}

