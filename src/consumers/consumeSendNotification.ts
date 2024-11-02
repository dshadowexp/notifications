import { logger } from "../monitoring/logger";
import { KafkaTopics } from "../config";
import { MessageUser, NotificationMessage } from "../types/messages";
import { IdempotencyService } from "../services/idempotency";
import { NotificationQueueManager } from "../queues/manager";
import { UserDataRepository } from "../repository/userData";
import { NotificationUserData } from "../types/notifications";
import { KafkaMessageProcessor, ProcessorMessageData } from "@tuller/lib";
import { validateSendNotificationRequest } from "../validations/requests";
import { ValidationError } from "../lib/errors";

export class SendNotificationConsumer extends KafkaMessageProcessor {
    constructor(
        private readonly queueManager: NotificationQueueManager,
        private readonly idempotencyService: IdempotencyService,
        private readonly userDataRepository: UserDataRepository,
    ) {
        super(KafkaTopics.SEND_NOTIFICATION);
    }

    validateMessage(message: NotificationMessage) {
        const { error } = validateSendNotificationRequest(message);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }

    async processMessage({ message }: ProcessorMessageData): Promise<void> {
        try {
            const notification: NotificationMessage = message;
      
            // Validate message structure and required fields
            this.validateMessage(notification);

            const { messageId } = notification.metadata;

            // Check if message is already being processed or has been processed
            if (await this.idempotencyService.isProcessing(messageId)) {
                logger().info(`Message ${messageId} is already being processed`);
                return;
            }

            if (await this.idempotencyService.hasBeenProcessed(messageId)) {
                logger().info(`Message ${messageId} has already been processed`);
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
                logger().info(`Failed to start processing message ${messageId}`);
                return;
            }

            const recipient = await this.processRecipient(notification.user);

            if (!recipient) {
                logger().info(`Failed to process recipient`);
                return;
            }
        
            const { 
                uid, name, email, 
                phone_number, device_token, whatsapp 
            } = recipient;

            await Promise.all(
                activeChannels.map(async (channel) => {
                    try {
                        await this.processChannel(channel, notification, { uid, name, email, phone_number, device_token, whatsapp });
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
            logger().error('Error processing message:', error);
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
        if (notification.channels.whatsapp) {
            channels.push('whatsapp');
        }
    
        return channels;
    }

    private async processRecipient(
        user: MessageUser
    ): Promise<any> {
        const { native, foreign } = user;

        if (native) {
            const { id } = native;
            const userNotificationData = await this.userDataRepository.findByUid(id);

            if (!userNotificationData) {
                logger().info(`User with id: ${id} does not exist`);
                return null;
            }

            const { uid, name, email, phone_number, device_token, whatsapp } = userNotificationData;
            return { uid, name, email, phone_number, device_token, whatsapp };
        }

        if (foreign) {
            const { name, email, phone_number, whatsapp } = foreign;
            return { name, email, phone_number, whatsapp };
        }
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
            case 'whatsapp':
                await this.processWhatsappNotification(notification, userData);
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
                    userId: notification.user.native?.id || userData.email,
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
                    userId: notification.user.native?.id || userData.phone_number,
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
                    userId: notification.user.native?.id || userData.device_token,
                    priority: notification.metadata.priority,
                    timestamp: Date.now()
                }
            })
        }
    }

    private async processWhatsappNotification(notification: NotificationMessage, userData: NotificationUserData): Promise<void> {
        if (notification.channels.whatsapp && userData.whatsapp) {
            await this.queueManager.addWhatsappNotification({
                payload: {
                    to: userData.whatsapp,
                    body: notification.channels.whatsapp.body,
                },
                metadata: {
                    messageId: notification.metadata.messageId,
                    userId: notification.user.native?.id || userData.whatsapp,
                    priority: notification.metadata.priority,
                    timestamp: Date.now()
                }
            })
        }
    }
}