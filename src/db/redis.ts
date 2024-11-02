import Redis, { RedisOptions } from "ioredis";
import { logger } from "../monitoring/logger";

export function startRedis(configOptions: RedisOptions) {
    const redis = new Redis(configOptions);

    redis.on("connect", () => {
        logger().info('Redis successfully connected');
    })

    redis.on("error", (error) => {
        logger().error("Redis error connecting:", error.message);
    })

    redis.setMaxListeners(0);

    return redis;
}