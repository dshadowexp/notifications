import { EachMessagePayload } from "kafkajs";

export abstract class KafkaConsumer {
    protected constructor(protected readonly topic: string) {}

    public async listen(subscriber: (topic: string, handler: (data: any) => void) => Promise<void>) {
        await subscriber(this.topic, this.processMessage);
    }

    abstract validateMessage(message: any): boolean;
    abstract processMessage({ topic, partition, message }: EachMessagePayload): Promise<void>
}