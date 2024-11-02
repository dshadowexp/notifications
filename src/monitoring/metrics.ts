import config from '../config';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Create a Registry singleton
const global = globalThis as any;
export const metricsRegistry = global.prometheusRegistry || new Registry();
global.prometheusRegistry = metricsRegistry;

// Metric name builder to ensure consistency
const getMetricName = (base: string) => `${config.APP_ID}_${base}`;

// Store instances to prevent duplicate registration
const metricInstances = new Map<string, NotificationMetrics>();

export class NotificationMetrics {
    private readonly namespace = config.APP_ID;
    
    // Queue metrics
    private jobsProcessed: Counter | undefined;
    private jobsFailedTotal: Counter | undefined;
    private jobsInQueue: Gauge | undefined;
    private jobProcessingDuration: Histogram | undefined;
    private queueLatency: Histogram | undefined;
    
    // Provider metrics
    private providerErrors: Counter | undefined;
    private providerLatency: Histogram | undefined;
    private providerRequestsTotal: Counter | undefined;

    private constructor(protected queueName: string, protected providerName: string) {
        // Initialize queue metrics
        this.initializeMetrics();
    }

    // Singleton factory method
    static getInstance(queueName: string, providerName: string): NotificationMetrics {
        const key = `${queueName}-${providerName}`;
        if (!metricInstances.has(key)) {
            metricInstances.set(key, new NotificationMetrics(queueName, providerName));
        }
        return metricInstances.get(key)!;
    }

    private getOrCreateCounter(name: string, help: string, labelNames: string[]): Counter {
        const metricName = getMetricName(name);
        const existing = metricsRegistry.getSingleMetric(metricName);
        if (existing) {
            return existing as Counter;
        }
        return new Counter({
            name: metricName,
            help,
            labelNames,
            registers: [metricsRegistry]
        });
    }

    private getOrCreateHistogram(name: string, help: string, labelNames: string[], buckets: number[]): Histogram {
        const metricName = getMetricName(name);
        const existing = metricsRegistry.getSingleMetric(metricName);
        if (existing) {
            return existing as Histogram;
        }
        return new Histogram({
            name: metricName,
            help,
            labelNames,
            buckets,
            registers: [metricsRegistry]
        });
    }

    private getOrCreateGauge(name: string, help: string, labelNames: string[]): Gauge {
        const metricName = getMetricName(name);
        const existing = metricsRegistry.getSingleMetric(metricName);
        if (existing) {
            return existing as Gauge;
        }
        return new Gauge({
            name: metricName,
            help,
            labelNames,
            registers: [metricsRegistry]
        });
    }

    private initializeMetrics(): void {
        try {
            // Initialize queue metrics
            this.jobsProcessed = this.getOrCreateCounter(
                'jobs_processed_total',
                'Total number of processed jobs',
                ['queue', 'status']
            );

            this.jobsFailedTotal = this.getOrCreateCounter(
                'jobs_failed_total',
                'Total number of failed jobs',
                ['queue', 'error_type']
            );

            this.jobsInQueue = this.getOrCreateGauge(
                'jobs_in_queue',
                'Current number of jobs in queue',
                ['queue', 'status']
            );

            this.jobProcessingDuration = this.getOrCreateHistogram(
                'job_processing_duration_seconds',
                'Time spent processing jobs',
                ['queue'],
                [0.1, 0.5, 1, 2, 5]
            );

            this.queueLatency = this.getOrCreateHistogram(
                'queue_latency_seconds',
                'Time jobs spend waiting in queue',
                ['queue', 'priority'],
                [1, 5, 15, 30, 60, 120]
            );

            // Initialize provider metrics
            this.providerErrors = this.getOrCreateCounter(
                'provider_errors_total',
                'Total number of provider errors',
                ['queue', 'provider', 'error_type']
            );

            this.providerLatency = this.getOrCreateHistogram(
                'provider_latency_seconds',
                'Provider request latency',
                ['queue', 'provider'],
                [0.1, 0.5, 1, 2, 5]
            );

            this.providerRequestsTotal = this.getOrCreateCounter(
                'provider_requests_total',
                'Total number of provider requests',
                ['queue', 'provider', 'status']
            );
        } catch (error) {
            console.error('Error initializing metrics:', error);
            throw error;
        }
    }

    // Queue metric methods with error handling
    incrementJobsProcessed(status: 'success' | 'failure'): void {
        try {
            this.jobsProcessed?.inc({ queue: this.queueName, status });
        } catch (error) {
            console.error('Error incrementing jobs processed metric:', error);
        }
    }

    incrementJobsFailed(errorType: string): void {
        try {
            this.jobsFailedTotal?.inc({ queue: this.queueName, error_type: errorType });
        } catch (error) {
            console.error('Error incrementing jobs failed metric:', error);
        }
    }

    setJobsInQueue(count: number, status: 'waiting' | 'active' | 'delayed'): void {
        try {
            this.jobsInQueue?.set({ queue: this.queueName, status }, count);
        } catch (error) {
            console.error('Error setting jobs in queue metric:', error);
        }
    }

    observeJobProcessingDuration(durationSecs: number): void {
        try {
            this.jobProcessingDuration?.observe({ queue: this.queueName }, durationSecs);
        } catch (error) {
            console.error('Error observing job processing duration:', error);
        }
    }

    observeQueueLatency(priority: number, delaySecs: number): void {
        try {
            this.queueLatency?.observe(
                { queue: this.queueName, priority: priority.toString() },
                delaySecs
            );
        } catch (error) {
            console.error('Error observing queue latency:', error);
        }
    }

    // Provider metric methods with error handling
    incrementProviderErrors(errorType: string): void {
        try {
            this.providerErrors?.inc({
                queue: this.queueName,
                provider: this.providerName,
                error_type: errorType
            });
        } catch (error) {
            console.error('Error incrementing provider errors:', error);
        }
    }

    observeProviderLatency(durationSecs: number): void {
        try {
            this.providerLatency?.observe(
                { queue: this.queueName, provider: this.providerName },
                durationSecs
            );
        } catch (error) {
            console.error('Error observing provider latency:', error);
        }
    }

    incrementProviderRequests(status: 'success' | 'failure'): void {
        try {
            this.providerRequestsTotal?.inc({
                queue: this.queueName,
                provider: this.providerName,
                status
            });
        } catch (error) {
            console.error('Error incrementing provider requests:', error);
        }
    }
}