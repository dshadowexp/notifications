import { Redis } from 'ioredis';

type ProcessingStatusType = 'processing' | 'completed' | 'failed';

export interface ProcessingStatus {
    status: ProcessingStatusType;
    timestamp: number;
    channels: {
        [key: string]: {
            status: ProcessingStatusType;
            error?: string;
            completedAt?: number;
        };
    };
}

export class IdempotencyService {
    private readonly keyPrefix = 'notification:';
    private readonly processingWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    constructor(private readonly redis: Redis) {}

    private getKey(messageId: string): string {
        return `${this.keyPrefix}${messageId}`;
    }

    async isProcessing(messageId: string): Promise<boolean> {
        const status = await this.getProcessingStatus(messageId);
        return status?.status === 'processing';
    }

    async hasBeenProcessed(messageId: string): Promise<boolean> {
        const status = await this.getProcessingStatus(messageId);
        return status?.status === 'completed';
    }

    async getProcessingStatus(messageId: string): Promise<ProcessingStatus | null> {
        const data = await this.redis.get(this.getKey(messageId));
        return data ? JSON.parse(data) : null;
    }

    async startProcessing(messageId: string, channels: string[]): Promise<boolean> {
        const key = this.getKey(messageId);
        const status: ProcessingStatus = {
            status: 'processing',
            timestamp: Date.now(),
            channels: channels.reduce((acc, channel) => ({
                ...acc,
                [channel]: { status: 'pending' }
            }), {})
        };

        // Use Redis SETNX to ensure atomic operation
        const set = await this.redis.set(
            key,
            JSON.stringify(status),
            'PX',
            this.processingWindow
        );

        return !!set;
    }

    async updateChannelStatus(
        messageId: string,
        channel: string,
        status: 'completed' | 'failed',
        error?: string
    ): Promise<void> {
        const key = this.getKey(messageId);
        
        // Use Redis WATCH for optimistic locking
        await this.redis.watch(key);

        const currentData = await this.getProcessingStatus(messageId);
        if (!currentData) return;

        currentData.channels[channel] = {
        status,
        ...(error && { error }),
        ...(status === 'completed' && { completedAt: Date.now() })
        };

        // Check if all channels are processed
        const allChannelsComplete = Object.values(currentData.channels)
        .every(ch => ch.status === 'completed' || ch.status === 'failed');

        if (allChannelsComplete) {
            currentData.status = 'completed';
        }

        const multi = this.redis.multi();
        multi.set(key, JSON.stringify(currentData), 'PX', this.processingWindow);
        await multi.exec();
    }

    async cleanup(): Promise<void> {
        // Implement cleanup of old records if needed
        const keys = await this.redis.keys(`${this.keyPrefix}*`);
        const now = Date.now();

        for (const key of keys) {
            const data = await this.redis.get(key);
            if (data) {
                const status: ProcessingStatus = JSON.parse(data);
                if (now - status.timestamp > this.processingWindow) {
                    await this.redis.del(key);
                }
            }
        }
    }
}