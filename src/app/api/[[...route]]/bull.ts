// import { Hono } from "hono";
// import { createBullBoard } from "@bull-board/api";
// import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
// import { HonoAdapter } from "@bull-board/hono";
// import { emailQueue } from "@/queues/email-queue";
// import { reportQueue } from "@/queues/report-queue";
// import { taskReminderQueue } from "@/queues/task-reminder-queue";
// import { serveStatic } from "@hono/node-server/serve-static";
// import { sessionMiddleware } from "@/lib/session-middleware";
// import { adminMiddleware } from "@/lib/admin-middleware";

// // 1. Khởi tạo Hono Adapter
// const serverAdapter = new HonoAdapter(serveStatic);

// // 2. Cấu hình BullBoard
// createBullBoard({
//     queues: [
//         new BullMQAdapter(emailQueue),
//         new BullMQAdapter(reportQueue),
//         new BullMQAdapter(taskReminderQueue),
//     ],
//     serverAdapter,
// });

// serverAdapter.setBasePath("/api/admin/bull/queues");

// const adminApp = new Hono();

// adminApp.use("*", sessionMiddleware, adminMiddleware);

// adminApp.route("/queues", serverAdapter.registerPlugin());

// export default adminApp;
