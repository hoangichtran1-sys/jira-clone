// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { Queue } from "bullmq";
// import { redis } from "@/lib/redis";

// export const taskReminderQueue = new Queue("reminder-queue", {
//     connection: redis as any,
// });

// export async function enqueueTaskReminderCronJob() {
//     await taskReminderQueue.add(
//         "task-reminder",
//         {},
//         {
//             attempts: 3,
//             backoff: 3000,
//             repeat: {
//                 pattern: "0 7 * * *",
//             },
//         },
//     );
// }
