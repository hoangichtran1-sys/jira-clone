import { schedules, logger } from "@trigger.dev/sdk";
import { processReportJob } from "@/jobs/report-job";

export const reportScheduledTask = schedules.task({
    id: "report-scheduled-task",
    ttl: "5m",
    cron: {
        pattern: "0 6 * * 1",
        timezone: "Asia/Bangkok",
        window: "10m",
    },
    run: async (payload) => {
        await processReportJob();

        logger.info(payload.scheduleId);
        logger.info(payload.type);
    },
});
