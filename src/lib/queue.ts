import { Queue } from "bullmq";
import { redisConnection } from "./redis";

export const queueConfig = {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,  // Thử lại tối đa 3 lần
        backoff: 3000  // Chờ 3 giây trước khi thử lại
    }
}

export const createQueue = (queueName: string) => {
    return new Queue(queueName, queueConfig);
}
