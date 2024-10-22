import Redis from "ioredis";

export function startRedis() {
    const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    return redis;
}