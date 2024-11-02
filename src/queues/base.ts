import { Queue, Worker, Job, QueueEvents, Metrics, MetricsTime } from 'bullmq';
import { QueueJobData } from '../types/notifications';
import { NotificationProvider } from '../providers/base';
import { DEFAULT_QUEUE_CONFIG } from './config';
import { logger } from '../monitoring/logger';
import { NotificationMetrics } from '../monitoring/metrics';

export abstract class NotificationQueue {
    protected queue: Queue;
    protected events: QueueEvents;
    protected worker: Worker | undefined;
    protected metrics: NotificationMetrics;

    constructor(
        protected readonly queueName: string,
        protected readonly concurrency: number = 10,
        protected provider: NotificationProvider,
    ) {
        this.queue = new Queue(queueName, DEFAULT_QUEUE_CONFIG);
        this.events = new QueueEvents(queueName, DEFAULT_QUEUE_CONFIG);
        this.metrics = NotificationMetrics.getInstance(queueName, this.provider.name);
        this.queue.setMaxListeners(0);
        this.events.setMaxListeners(0);
    }

    private async intializeProvider(): Promise<void> {
        await this.provider.initialize();
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

        // Set up periodic queue size monitoring
        setInterval(async () => {
            const jobCounts = await this.queue.getJobCounts();
            this.metrics.setJobsInQueue(jobCounts.waiting, 'waiting');
            this.metrics.setJobsInQueue(jobCounts.active, 'active');
            this.metrics.setJobsInQueue(jobCounts.delayed, 'delayed');
        }, 5000);

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
        const startTime = Date.now();
        const waitTime = (startTime - job.timestamp) / 1000;
        
        this.metrics.observeQueueLatency(
            job.data.metadata?.priority || 0,
            waitTime
        );

        try {
            const providerStartTime = Date.now();
            const result = await this.provider!.send(job.data.payload);
            const providerDuration = (Date.now() - providerStartTime) / 1000;

            this.metrics.observeProviderLatency(providerDuration);
            
            if (!result.success) {
                this.metrics.incrementProviderRequests('failure');

                throw new Error(result.error || 'Notification failed');
            }

            this.metrics.incrementProviderRequests('success');

            await job.updateProgress(100);

            const processingDuration = (Date.now() - startTime) / 1000;
            this.metrics.observeJobProcessingDuration(processingDuration);
            this.metrics.incrementJobsProcessed('success');
        } catch (error) {
            await job.updateProgress(0);

            this.metrics.incrementJobsFailed(
                error instanceof Error ? error.constructor.name : 'UnknownError'
            );

            throw error;
        }
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