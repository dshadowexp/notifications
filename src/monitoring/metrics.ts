import config from '../config';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Create a new registry
export const metricsRegistry = new Registry();

// Metrics for notification queues
export class NotificationMetrics {
    private readonly namespace = config.APP_ID;
    
    // Queue metrics
    private jobsProcessed: Counter;
    private jobsFailedTotal: Counter;
    private jobsInQueue: Gauge;
    private jobProcessingDuration: Histogram;
    private queueLatency: Histogram;
    
    // Provider metrics
    private providerErrors: Counter;
    private providerLatency: Histogram;
    private providerRequestsTotal: Counter;

    constructor(protected queueName: string, protected providerName: string) {
        // Initialize queue metrics
        this.jobsProcessed = new Counter({
            name: `${this.namespace}_jobs_processed_total`,
            help: 'Total number of processed jobs',
            labelNames: ['queue', 'status'],
            registers: [metricsRegistry]
        });

        this.jobsFailedTotal = new Counter({
            name: `${this.namespace}_jobs_failed_total`,
            help: 'Total number of failed jobs',
            labelNames: ['queue', 'error_type'],
            registers: [metricsRegistry]
        });

        this.jobsInQueue = new Gauge({
            name: `${this.namespace}_jobs_in_queue`,
            help: 'Current number of jobs in queue',
            labelNames: ['queue', 'status'],
            registers: [metricsRegistry]
        });

        this.jobProcessingDuration = new Histogram({
            name: `${this.namespace}_job_processing_duration_seconds`,
            help: 'Time spent processing jobs',
            labelNames: ['queue'],
            buckets: [0.1, 0.5, 1, 2, 5],
            registers: [metricsRegistry]
        });

        this.queueLatency = new Histogram({
            name: `${this.namespace}_queue_latency_seconds`,
            help: 'Time jobs spend waiting in queue',
            labelNames: ['queue', 'priority'],
            buckets: [1, 5, 15, 30, 60, 120],
            registers: [metricsRegistry]
        });

        // Initialize provider metrics
        this.providerErrors = new Counter({
            name: `${this.namespace}_provider_errors_total`,
            help: 'Total number of provider errors',
            labelNames: ['queue', 'provider', 'error_type'],
            registers: [metricsRegistry]
        });

        this.providerLatency = new Histogram({
            name: `${this.namespace}_provider_latency_seconds`,
            help: 'Provider request latency',
            labelNames: ['queue', 'provider'],
            buckets: [0.1, 0.5, 1, 2, 5],
            registers: [metricsRegistry]
        });

        this.providerRequestsTotal = new Counter({
            name: `${this.namespace}_provider_requests_total`,
            help: 'Total number of provider requests',
            labelNames: ['queue', 'provider', 'status'],
            registers: [metricsRegistry]
        });
    }

    // Queue metric methods
    incrementJobsProcessed(status: 'success' | 'failure'): void {
        this.jobsProcessed.inc({ queue: this.queueName, status });
    }

    incrementJobsFailed(errorType: string): void {
        this.jobsFailedTotal.inc({ queue: this.queueName, error_type: errorType });
    }

    setJobsInQueue(count: number, status: 'waiting' | 'active' | 'delayed'): void {
        this.jobsInQueue.set({ queue: this.queueName, status }, count);
    }

    observeJobProcessingDuration(durationSecs: number): void {
        this.jobProcessingDuration.observe({ queue: this.queueName }, durationSecs);
    }

    observeQueueLatency(priority: number, delaySecs: number): void {
        this.queueLatency.observe({ queue: this.queueName, priority: priority.toString() }, delaySecs);
    }

    // Provider metric methods
    incrementProviderErrors(errorType: string): void {
        this.providerErrors.inc({ queue: this.queueName, provider: this.providerName, error_type: errorType });
    }

    observeProviderLatency(durationSecs: number): void {
        this.providerLatency.observe({ queue: this.queueName, provider: this.providerName }, durationSecs);
    }

    incrementProviderRequests(status: 'success' | 'failure'): void {
        this.providerRequestsTotal.inc({ queue: this.queueName, provider: this.providerName, status });
    }
}
