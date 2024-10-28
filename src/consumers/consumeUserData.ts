import { KafkaTopics } from "../config";
import { logger } from "../monitoring/logger";
import { UserDataRepository } from "../repository/userData";
import { KafkaMessageProcessor, ProcessorMessageData } from "@tuller/lib";
import { NotificationUserData } from "../types/notifications";
import { validateCreateUserDataEvent } from "../validations/requests";

export class CreateNotificationUserDataConsumer extends KafkaMessageProcessor {
    constructor(
        private readonly userDataRepository: UserDataRepository,
    ) {
        super(KafkaTopics.CREATE_USER_NOTIFICATION_DATA);
    }

    async processMessage({ message }: ProcessorMessageData): Promise<void> {
        try {
            const incomingUserData: NotificationUserData = message;

            // Validate message structure and required fields
            if (!this.validateMessage(incomingUserData)) {
                throw new Error('Invalid message format');
            }

            // Check if user with uid already exists
            const { uid } = incomingUserData;
            const userData = await this.userDataRepository.findByUid(uid);
            if (userData) {
                console.log(`UserData with uid: ${uid} has already been created`);
                return;
            }

            await this.userDataRepository.create(incomingUserData);
            logger().info(`UserData with uid: ${uid} created successfully`);
        } catch (error) {
            logger().error(`CreateNotificationUserDataConsumer error`, error);
        }
    }

    validateMessage(message: any): boolean {
        const { error } = validateCreateUserDataEvent(message);
        return !error;
    }
}

export class UpdateNotificationUserDataConsumer extends KafkaMessageProcessor {
    constructor(
        private readonly userDataRepository: UserDataRepository,
    ) {
        super(KafkaTopics.UPDATE_USER_NOTIFICATION_DATA);
    }

    async processMessage({ message }: ProcessorMessageData): Promise<void> {}

    validateMessage(message: any): boolean {
        return true
    }
}