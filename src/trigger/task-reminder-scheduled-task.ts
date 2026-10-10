import { schedules, logger } from "@trigger.dev/sdk";
import { processTaskReminder } from "@/jobs/task-reminder-job";

export const taskReminderScheduledTask = schedules.task({
    id: "task-reminder-scheduled-task",
    ttl: "5m",
    cron: {
        pattern: "0 7 * * *",
        timezone: "Asia/Bangkok",
        window: "10m",
    },
    run: async (payload) => {
        await processTaskReminder();

        logger.info(payload.scheduleId);
        logger.info(payload.type);
    },
});
