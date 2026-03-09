import { Queue } from "bullmq";
import { connection } from "@/lib/redis";
import { EmailJobData } from "@/types";

export const emailQueue = new Queue("email-queue", { connection });

export async function enqueueSendEmailInvitation(data: EmailJobData) {
    await emailQueue.add("send-email-invitation", data, {
        attempts: 5, // retries
        backoff: { type: "exponential", delay: 1000 }, // 1s,2s,4s,...
        removeOnComplete: 1000, // keep last 1000 complete jobs
        removeOnFail: 1000, // keep last 1000 failed jobs
        jobId: `invitation:${data.email}:${Date.now()}`, // idempotency key (optional)
    });
}

export async function enqueueSendEmailDeleteWorkspace(data: EmailJobData) {
    await emailQueue.add("send-email-workspace-delete", data, {
        attempts: 3, // retries
        backoff: { type: "exponential", delay: 1000 }, // 1s,2s,4s,...
        removeOnComplete: 1000, // keep last 1000 complete jobs
        removeOnFail: 1000, // keep last 1000 failed jobs
        jobId: `workspace-delete:${data.email}:${Date.now()}`, // idempotency key (optional)
    });
}

export async function enqueueSendEmailDeleteMember(data: EmailJobData) {
    await emailQueue.add("send-email-member-delete", data, {
        attempts: 3, // retries
        backoff: { type: "exponential", delay: 1000 }, // 1s,2s,4s,...
        removeOnComplete: 1000, // keep last 1000 complete jobs
        removeOnFail: 1000, // keep last 1000 failed jobs
        jobId: `member-delete:${data.email}:${Date.now()}`, // idempotency key (optional)
    });
}