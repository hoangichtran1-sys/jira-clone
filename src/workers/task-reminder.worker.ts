import { QueueEvents, Worker } from "bullmq";
import { connection } from "@/lib/redis";
import { processTaskReminder } from "@/jobs/task-reminder-job";

const concurrency = Number(process.env.TASK_REMINDER_CONCURRENCY ?? 5); // Xử lý tối đa 5 job cùng lúc
export function startTaskReminderWorker() {
    const taskReminderWorker = new Worker(
        "reminder-queue",
        async (job) => {
            await processTaskReminder();
            console.log(`Job "${job.name}" đã hoàn thành`);
        },
        {
            connection,
            concurrency,
            limiter: {
                max: 5,
                duration: 1000,
            },
        },
    );

    const taskReminderEvents = new QueueEvents("reminder-queue", {
        connection,
    });
    taskReminderEvents.on("completed", ({ jobId }) => {
        console.log(`✅ taskReminder ${jobId} completed`);
    });
    taskReminderEvents.on("failed", ({ jobId, failedReason }) => {
        console.error(`❌ taskReminder ${jobId} failed: ${failedReason}`);
    });

    return taskReminderWorker;
}
