// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { Queue } from "bullmq";
// import { redis } from "@/lib/redis";

// export const reportQueue = new Queue("report-queue", {
//     connection: redis as any,
// });

// export async function enqueueReportCronJob() {
//     await reportQueue.add(
//         "report-weekly",
//         {},
//         {
//             attempts: 3,
//             backoff: 3000,
//             repeat: {
//                 pattern: "0 6 * * 1",
//             },
//         },
//     );
// }
