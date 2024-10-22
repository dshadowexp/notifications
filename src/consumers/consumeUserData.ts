import { EachMessagePayload } from "kafkajs";
import { UserDataRepository } from "../repository/userData";
import { KafkaConsumer } from "./base";
import { KafkaTopics } from "../config";

export class CreateNotificationUserDataConsumer extends KafkaConsumer {
    constructor(
        private readonly userDataRepository: UserDataRepository,
    ) {
        super(KafkaTopics.CREATE_USER_NOTIFICATION_DATA);
    }

    async processMessage({ message }: EachMessagePayload): Promise<void> {}

    validateMessage(message: any): boolean {
        return true
    }
}

export class UpdateNotificationUserDataConsumer extends KafkaConsumer {
    constructor(
        private readonly userDataRepository: UserDataRepository,
    ) {
        super(KafkaTopics.UPDATE_USER_NOTIFICATION_DATA);
    }

    async processMessage({ message }: EachMessagePayload): Promise<void> {}

    validateMessage(message: any): boolean {
        return true
    }
}