import { scheduleJob } from "@/lib/schedule-job";
import { processTaskReminder } from "./jobs/task-reminder.job";
import { processReportJob } from "./jobs/report.job";

export const startJobs = () => {
    return [
        scheduleJob("Reports", "0 6 * * 1", processReportJob),
        scheduleJob("Task Reminder", "0 7 * * *", processTaskReminder)
    ];
};
