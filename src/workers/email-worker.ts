import { Worker } from "bullmq";
import { queueConfig } from "@/lib/queue.js";
import { sendEmail } from "@/utils/emailService";

// Worker xử lý queue "emailQueue"
const emailWorker = new Worker(
    "emailQueue",
    async (job) => {
        switch (job.name) {
            case "sendEmailInvitation":
                console.log(`📧 Đang gửi email tới ${job.data.email}`);
                await sendEmail(job.data);
                console.log(`✅ Email tới ${job.data.email} đã được gửi`);
                break;

            case "sendEmailWorkspaceDelete":
                console.log(`📧 Đang gửi email tới ${job.data.email}`);
                await sendEmail(job.data);
                console.log(`✅ Email tới ${job.data.email} đã được gửi`);
                break;
        }
    },
    {
        ...queueConfig, // Sử dụng cấu hình chung
        concurrency: 5, // Xử lý tối đa 5 job cùng lúc
    },
);

emailWorker.on("completed", (job) => {
    console.log(`${job.id} has completed!`);
});

// Xử lý lỗi
emailWorker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed`, err);
});

export default emailWorker;
