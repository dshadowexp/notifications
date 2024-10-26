import { Queue, Worker, Job, QueueEvents, Metrics, MetricsTime } from 'bullmq';
import { QueueJobData } from '../types/notifications';
import { NotificationProvider } from '../providers/base';
import { DEFAULT_QUEUE_CONFIG } from './config';
import { logger } from '../lib/utils';

export abstract class NotificationQueue {
    protected queue: Queue;
    protected events: QueueEvents;
    protected worker: Worker | undefined;
    protected provider: NotificationProvider | undefined;

    constructor(
        protected readonly queueName: string,
        protected readonly concurrency: number = 10
    ) {
        this.queue = new Queue(queueName, DEFAULT_QUEUE_CONFIG);
        this.events = new QueueEvents(queueName, DEFAULT_QUEUE_CONFIG);
    }

    private async intializeProvider(): Promise<void> {
        await this.provider!.initialize();
    }

    async initialize(): Promise<void> {
        await this.intializeProvider();
        
        this.worker = new Worker(
            this.queueName,
            async (job: Job) => this.processJob(job),
            {
                ...DEFAULT_QUEUE_CONFIG,
                concurrency: this.concurrency,
                metrics: {
                    maxDataPoints: MetricsTime.ONE_WEEK * 2,
                },
            }
        );

        this.setupWorkerEvents();

        logger().info(`${this.queueName} queue has been initialized`);
    }

    private setupWorkerEvents(): void {
        this.worker!
            .on('failed', (job, err) => {
                logger().info(`${this.queueName}: Job ${job} failed with error ${err.message}`);
            })
            .on('error', (err) => {
                logger().error(`${this.queueName}: Worker error:`, err);
            })
            .on('stalled', (job) => {
                logger().info(`${this.queueName}: Job ${job} stalled`);
            });
        
        this.events
            .on('completed', ({ jobId, returnvalue }) => {
                logger().info(`Job ${jobId} has completed in ${this.queueName}\n${returnvalue}`);
            })
            .on('failed', ({ jobId, failedReason }) => {
                logger().info(`Job ${jobId} has failed in ${this.queueName}\n${failedReason}`);
            });
    }

    async addJob(data: QueueJobData, options: any = {}): Promise<Job> {
        return this.queue.add(this.queueName, data, {
            ...options,
            priority: data.metadata?.priority || 0,
        });
    }

    protected async processJob(job: Job<QueueJobData>): Promise<void> {
        try {
            const result = await this.provider!.send(job.data.payload);
            
            if (!result.success) {
                throw new Error(result.error || 'Notification failed');
            }

            await job.updateProgress(100);
        } catch (error) {
            await job.updateProgress(0);
            throw error;
        }
    }

    async metrics(type: 'completed' | 'failed', start=0, end=-1): Promise<Metrics> {
        return await this.queue.getMetrics(type, start, end);
    }

    async pause(): Promise<void> {
        await this.queue.pause();
    }

    async resume(): Promise<void> {
        await this.queue.resume();
    }

    async close(): Promise<void> {
        await this.queue.close();
        await this.worker!.close();
        await this.events!.close();
    }
}