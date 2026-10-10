// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { QueueEvents, Worker } from "bullmq";
// import { redis } from "@/lib/redis";
// import { processTaskReminder } from "@/jobs/task-reminder-job";
// import { env } from "@/lib/env";

// const concurrency = env.REPORT_CONCURRENCY; // Xử lý tối đa 5 job cùng lúc
// export function startTaskReminderWorker() {
//     const taskReminderWorker = new Worker(
//         "reminder-queue",
//         async (job) => {
//             await processTaskReminder();
//             console.log(`Job "${job.name}" đã hoàn thành`);
//         },
//         {
//             connection: redis as any,
//             concurrency,
//             limiter: {
//                 max: 5,
//                 duration: 1000,
//             },
//         },
//     );

//     const taskReminderEvents = new QueueEvents("reminder-queue", {
//         connection: redis as any,
//     });
//     taskReminderEvents.on("completed", ({ jobId }) => {
//         console.log(`✅ taskReminder ${jobId} completed`);
//     });
//     taskReminderEvents.on("failed", ({ jobId, failedReason }) => {
//         console.error(`❌ taskReminder ${jobId} failed: ${failedReason}`);
//     });

//     return taskReminderWorker;
// }
