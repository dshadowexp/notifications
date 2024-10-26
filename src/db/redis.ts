import Redis, { RedisOptions } from "ioredis";
import { logger } from "../lib/utils";

export function startRedis(configOptions: RedisOptions) {
    const redis = new Redis(configOptions);

    redis.on("connect", () => {
        logger().info('Redis successfully connected');
    })

    redis.on("error", (error) => {
        logger().error("Redis error connecting:", error.message);
    })

    return redis;
}