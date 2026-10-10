/* eslint-disable @typescript-eslint/no-explicit-any */
import { ID, Query } from "node-appwrite";
import { Task, TaskStatus } from "@/features/tasks/types";
import { ensureEmailTarget } from "@/features/workspaces/utils";
import { createAdminClient } from "@/lib/appwrite";
import { getAssigneeUser } from "@/features/tasks/utils";
import { DATABASES_ID, TASKS_ID } from "@/config/appwrite";
import { env } from "@/lib/env";

export const processTaskReminder = async () => {
    try {
        const { databases, messaging } = await createAdminClient();

        const now = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(now.getDate() + 3);

        // 1. Lấy danh sách Task sắp hết hạn (trong 3 ngày tới)
        const tasks = await databases.listRows<Task>({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.notEqual("status", TaskStatus.DONE),
                Query.greaterThan("dueDate", now.toISOString()),
                Query.lessThan("dueDate", threeDaysLater.toISOString()),
                Query.limit(1000),
            ],
        });

        const populatedTasks = await Promise.all(
            tasks.rows.map(async (task) => {
                const assigneeUser = await getAssigneeUser({
                    databases,
                    assigneeId: task.assigneeId,
                });

                return {
                    ...task,
                    assigneeUserId: assigneeUser.userId,
                };
            }),
        );

        for (const task of populatedTasks) {
            // 2. Lấy emailTargetId của người được giao (Assignee)
            const targetId = await ensureEmailTarget({
                databases,
                userId: task.assigneeUserId,
            });

            if (!targetId) {
                console.log(
                    `Bỏ qua task ${task.name}: Không tìm thấy Target cho user ${task.assigneeUserId}`,
                );
                continue;
            }

            // 3. Gửi Email đích danh
            const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ffcc00;">
          <h2 style="color: #d4a017;">⚠️ Nhắc nhở: Task sắp hết hạn</h2>
          <p>Chào bạn, task <b>"${task.name}"</b> đang sắp đến hạn chót.</p>
          <p>📅 <b>Deadline:</b> ${new Date(task.dueDate).toLocaleString()}</p>
          <p>Vui lòng kiểm tra và hoàn thành đúng hạn.</p>
          <hr />
          <a href="${env.APP_URL}/workspaces/${task.workspaceId}/tasks/${task.$id}" 
             style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
             Xem chi tiết Task
          </a>
        </div>
      `;

            try {
                await messaging.createEmail({
                    messageId: ID.unique(),
                    subject: `[Urgent] Task Reminder: ${task.name}`,
                    content: htmlContent,
                    targets: [targetId],
                    html: true,
                });
                console.log(
                    `Đã gửi nhắc nhở cho task: ${task.name} tới User: ${task.assigneeId}`,
                );
            } catch (sendErr: any) {
                console.error(
                    `Lỗi gửi mail cho task ${task.$id}: ${sendErr.message}`,
                );
            }
        }

        console.log("Job finished successfully");
    } catch (err: any) {
        console.error("Lỗi hệ thống: " + err.message);
    }
};
