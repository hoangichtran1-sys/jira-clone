import { bootstrap } from "@/lib/bootstrap";

async function startWorker() {
    try {
        bootstrap();

        console.log("REDIS_URL:", process.env.REDIS_URL ? "Đã tìm thấy ✅" : "Không tồn tại ❌");

        const { loadWorkers } = await import("./load-workers");
        const { enqueueReportCronJob } = await import("@/queues/report-queue");
        const { enqueueTaskReminderCronJob } = await import("@/queues/task-reminder-queue");

        await loadWorkers();
        console.log("🚀 All workers started successfully");

        await Promise.all([
            enqueueReportCronJob(), 
            enqueueTaskReminderCronJob()
        ]);
        
        console.log("📅 Cron jobs enqueued");

    } catch (error) {
        console.error("❌ Lỗi trong quá trình khởi động Worker:", error);
        process.exit(1);
    }
}

startWorker();