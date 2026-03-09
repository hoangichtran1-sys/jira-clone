import { QueueEvents, Worker } from "bullmq";
import { connection } from "@/lib/redis";
import { processReportJob } from "@/jobs/report-job";

const concurrency = Number(process.env.REPORT_CONCURRENCY ?? 5); // Xử lý tối đa 5 job cùng lúc
export function startReportWeeklyWorker() {
    const reportWorker = new Worker(
        "report-queue",
        async (job) => {
            await processReportJob();
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

    const reportEvents = new QueueEvents("report-queue", {
        connection,
    });
    reportEvents.on("completed", ({ jobId }) => {
        console.log(`✅ report ${jobId} completed`);
    });
    reportEvents.on("failed", ({ jobId, failedReason }) => {
        console.error(`❌ report ${jobId} failed: ${failedReason}`);
    });

    return reportWorker;
}
