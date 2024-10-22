import { EachMessagePayload } from "kafkajs";
import { UserDataRepository } from "../repository/userData";

import { KafkaTopics } from "../config";
import { KafkaMessageProcessor, ProcessorMessageData } from "@tuller/lib";

export class CreateNotificationUserDataConsumer extends KafkaMessageProcessor {
    constructor(
        private readonly userDataRepository: UserDataRepository,
    ) {
        super(KafkaTopics.CREATE_USER_NOTIFICATION_DATA);
    }

    async processMessage({ message }: ProcessorMessageData): Promise<void> {}

    validateMessage(message: any): boolean {
        return true
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