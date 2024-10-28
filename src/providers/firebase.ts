import admin from 'firebase-admin';
import { Messaging } from 'firebase-admin/lib/messaging/messaging';
import { NotificationProvider } from './base';
import { NotificationPayload, NotificationResponse } from '../types/notifications';
import { ValidationError } from '../lib/errors';
import { validateFirebasePayload } from '../validations/providers';

export interface FirebaseConfig {
    projectId: string,
    clientEmail: string,
    privateKey: string
}

export class FirebaseMessagingProvider extends NotificationProvider {
    private messaging: Messaging | undefined;

    constructor(config: FirebaseConfig) {
        super('firebase', config);
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

    validatePayload(payload: NotificationPayload) {
        const { error } = validateFirebasePayload(payload);

        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }

    async send(payload: NotificationPayload): Promise<NotificationResponse> {
        try {
            this.validatePayload(payload)
        
            const message = {
                notification: {
                    title: payload.title,
                    body: payload.body,
                },
                data: payload.data,
                android: {
                    priority: 'high' as 'high' | 'normal',
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                        },
                    },
                },
            };

            if (Array.isArray(payload.to)) {
                const response = await this.messaging!.sendEachForMulticast({
                    ...message,
                    tokens: payload.to
                });

                return {
                    success: true,
                    messageId: `${response.responses.map(res => res.messageId).join(',')}`
                };
            } else {
                const response = await this.messaging!.send({
                    ...message,
                    token: payload.to
                });

                return {
                    success: true,
                    messageId: response
                };
            }
        } catch (error) {
            return this.handleError(error);
        }
    }
}

