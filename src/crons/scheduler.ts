import { scheduleJob } from "@/lib/schedule-job";
import { processTaskReminder } from "./jobs/task-reminder.job";
import { processReportJob } from "./jobs/report.job";

export const startJobs = () => {
    return [
        scheduleJob("Reports", "* * * * *", processReportJob),
        scheduleJob("Task Reminder", "* * * * *", processTaskReminder)
    ];
};
