// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { QueueEvents, Worker } from "bullmq";
// import { redis } from "@/lib/redis";
// import { processReportJob } from "@/jobs/report-job";
// import { env } from "@/lib/env";

// const concurrency = env.REPORT_CONCURRENCY; // Xử lý tối đa 5 job cùng lúc
// export function startReportWeeklyWorker() {
//     const reportWorker = new Worker(
//         "report-queue",
//         async (job) => {
//             await processReportJob();
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

//     const reportEvents = new QueueEvents("report-queue", {
//         connection: redis as any,
//     });
//     reportEvents.on("completed", ({ jobId }) => {
//         console.log(`✅ report ${jobId} completed`);
//     });
//     reportEvents.on("failed", ({ jobId, failedReason }) => {
//         console.error(`❌ report ${jobId} failed: ${failedReason}`);
//     });

//     return reportWorker;
// }
