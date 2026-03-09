import { Queue } from "bullmq";
import { connection } from "@/lib/redis";

export const reportQueue = new Queue("report-queue", { connection });

export async function enqueueReportCronJob() {
    await reportQueue.add(
        "report-weekly",
        {},
        {
            attempts: 3,
            backoff: 3000,
            repeat: {
                pattern: "0 6 * * 1",
            },
        },
    );
}
