import { EachMessagePayload } from "kafkajs";
import { KafkaConsumer } from "./base";
import { NotificationMessage } from "../types/messages";
import { IdempotencyService } from "../services/idempotency";
import { NotificationQueueManager } from "../queues/manager";
import { UserDataRepository } from "../repository/userData";
import { NotificationUserData } from "../types";
import { KafkaTopics } from "../config";

export class SendNotificationConsumer extends KafkaConsumer {
    constructor(
        private readonly queueManager: NotificationQueueManager,
        private readonly idempotencyService: IdempotencyService,
        private readonly userDataRepository: UserDataRepository,
    ) {
        super(KafkaTopics.SEND_NOTIFICATION);
    }

    validateMessage(message: NotificationMessage): boolean {
        return !!(
            message &&
            message.metadata &&
            message.metadata.messageId &&
            message.user &&
            message.channels &&
            Object.keys(message.channels).length > 0
        );
    }

    async processMessage({ message }: EachMessagePayload): Promise<void> {
        try {
            const notification: NotificationMessage = JSON.parse(message.value?.toString() || '');
      
            // Validate message structure and required fields
            if (!this.validateMessage(notification)) {
                throw new Error('Invalid message format');
            }

            const { messageId } = notification.metadata;

            // Check if message is already being processed or has been processed
            if (await this.idempotencyService.isProcessing(messageId)) {
                console.log(`Message ${messageId} is already being processed`);
                return;
            }

            if (await this.idempotencyService.hasBeenProcessed(messageId)) {
                console.log(`Message ${messageId} has already been processed`);
                return;
            }

            // Determine active channels
            const activeChannels = this.getActiveChannels(notification);
            
            // Start processing and track the message
            const started = await this.idempotencyService.startProcessing(
                messageId,
                activeChannels
            );

            if (!started) {
                console.log(`Failed to start processing message ${messageId}`);
                return;
            }

            const { id } = notification.user;
            const userNotificationData = await this.userDataRepository.findByUid(id);

            if (!userNotificationData) {
                console.log(`User with id: ${id} does not exist`);
                return;
            }

            await Promise.allSettled(
                activeChannels.map(async (channel) => {
                    try {
                        await this.processChannel(channel, notification, userNotificationData);
                        await this.idempotencyService.updateChannelStatus(
                            messageId,
                            channel,
                            'completed'
                        );
                    } catch (error) {
                        await this.idempotencyService.updateChannelStatus(
                            messageId,
                            channel,
                            'failed',
                            error as string
                        );
                        throw error;
                    }
                })
            );

        } catch (error) {
            console.error('Error processing message:', error);
        }
    }

    private getActiveChannels(notification: NotificationMessage): string[] {
        const channels: string[] = [];
    
        if (notification.channels.email) {
            channels.push('email');
        }
        if (notification.channels.sms) {
            channels.push('sms');
        }
        if (notification.channels.push) {
            channels.push('push');
        }
    
        return channels;
    }

    private async processChannel(
        channel: string,
        notification: NotificationMessage,
        userData: NotificationUserData
    ): Promise<void> {
        switch (channel) {
            case 'email':
                await this.processEmailNotification(notification, userData);
                break;
            case 'sms':
                await this.processSMSNotification(notification, userData);
                break;
            case 'push':
                await this.processPushNotification(notification, userData);
                break;
        }
    }

    private async processEmailNotification(notification: NotificationMessage, userData: NotificationUserData): Promise<void> {
        if (notification.channels.email && userData.email) {
            await this.queueManager.addEmailNotification({
                payload: {
                    to: userData.email,
                    title: notification.channels.email.subject,
                    body: notification.channels.email.body
                },
                metadata: {
                    messageId: notification.metadata.messageId,
                    userId: notification.user.id,
                    priority: notification.metadata.priority,
                    timestamp: Date.now()
                }
            })
        }
    }

    private async processSMSNotification(notification: NotificationMessage, userData: NotificationUserData): Promise<void> {
        if (notification.channels.sms && userData.phone_number) {
            await this.queueManager.addSMSNotification({
                payload: {
                    to: userData.phone_number,
                    body: notification.channels.sms.body
                },
                metadata: {
                    messageId: notification.metadata.messageId,
                    userId: notification.user.id,
                    priority: notification.metadata.priority,
                    timestamp: Date.now()
                }
            })
        }
    }

    private async processPushNotification(notification: NotificationMessage, userData: NotificationUserData): Promise<void> {
        if (notification.channels.push && userData.device_token) {
            await this.queueManager.addPushNotification({
                payload: {
                    to: userData.device_token,
                    title: notification.channels.push.title,
                    body: notification.channels.push.body,
                    data: notification.channels.push.data
                },
                metadata: {
                    messageId: notification.metadata.messageId,
                    userId: notification.user.id,
                    priority: notification.metadata.priority,
                    timestamp: Date.now()
                }
            })
        }
    }
}