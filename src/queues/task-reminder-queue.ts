import { Queue } from "bullmq";
import { connection } from "@/lib/redis";

export const taskReminderQueue = new Queue("reminder-queue", { connection });

export async function enqueueTaskReminderCronJob() {
    await taskReminderQueue.add(
        "task-reminder",
        {},
        {
            attempts: 3,
            backoff: 3000,
            repeat: {
                pattern: "0 7 * * *",
            },
        },
    );
}
