import { QueueEvents, Worker } from "bullmq";
import { sendEmail } from "@/utils/emailService";
import { EmailJobData } from "@/types";
import { connection } from "@/lib/redis";

const concurrency = Number(process.env.EMAIL_CONCURRENCY ?? 5); // Xử lý tối đa 5 job cùng lúc
export function startEmailWorker() {
    const emailWorker = new Worker<EmailJobData>(
        "email-queue",
        async (job) => {
            switch (job.name) {
                case "send-email-invitation":
                    console.log(`📧 Đang gửi email tới ${job.data.email}`);
                    await sendEmail(job.data);
                    console.log(`✅ Email tới ${job.data.email} đã được gửi`);
                    break;

                case "send-email-workspace-delete":
                    console.log(`📧 Đang gửi email tới ${job.data.email}`);
                    await sendEmail(job.data);
                    console.log(`✅ Email tới ${job.data.email} đã được gửi`);
                    break;

                case "send-email-member-delete":
                    console.log(`📧 Đang gửi email tới ${job.data.email}`);
                    await sendEmail(job.data);
                    console.log(`✅ Email tới ${job.data.email} đã được gửi`);
                    break;
            }
        },
        {
            connection,
            concurrency,
            limiter: {
                max: 10,
                duration: 1000,
            },
        },
    );

    const emailEvents = new QueueEvents("email-queue", { connection });
    emailEvents.on("completed", ({ jobId }) => {
        console.log(`✅ email ${jobId} completed`);
    });
    emailEvents.on("failed", ({ jobId, failedReason }) => {
        console.error(`❌ email ${jobId} failed: ${failedReason}`);
    });

    return emailWorker;
}
