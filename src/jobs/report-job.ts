/* eslint-disable @typescript-eslint/no-explicit-any */
import { Task, TaskStatus } from "@/features/tasks/types";
import { Workspace } from "@/features/workspaces/types";
import { Query, ID } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import {
    DATABASES_ID,
    PROJECTS_ID,
    TASKS_ID,
    WORKSPACES_ID,
} from "@/config/appwrite";
import { Project } from "@/features/projects/types";

export const processReportJob = async () => {
    try {
        const { databases, messaging } = await createAdminClient();

        const now = new Date().toISOString();

        // 1. Lấy tất cả workspace
        const workspaces = await databases.listRows<Workspace>({
            databaseId: DATABASES_ID,
            tableId: WORKSPACES_ID,
            queries: [Query.limit(1000)],
        });

        for (const workspace of workspaces.rows) {
            // Sử dụng Promise.all để lấy 3 loại dữ liệu
            const [allTasks, projects, overdueTasks, doneTasks] =
                await Promise.all([
                    // Tổng số task
                    databases.listRows<Task>({
                        databaseId: DATABASES_ID,
                        tableId: TASKS_ID,
                        queries: [
                            Query.equal("workspaceId", workspace.$id),
                            Query.limit(1),
                        ],
                    }),
                    // Tổng số project
                    databases.listRows<Project>({
                        databaseId: DATABASES_ID,
                        tableId: PROJECTS_ID,
                        queries: [
                            Query.equal("workspaceId", workspace.$id),
                            Query.limit(1),
                        ],
                    }),
                    // Task quá hạn
                    databases.listRows<Task>({
                        databaseId: DATABASES_ID,
                        tableId: TASKS_ID,
                        queries: [
                            Query.equal("workspaceId", workspace.$id),
                            Query.notEqual("status", TaskStatus.DONE),
                            Query.lessThan("dueDate", now),
                            Query.limit(1),
                        ],
                    }),
                    // Task đã xong
                    databases.listRows<Task>({
                        databaseId: DATABASES_ID,
                        tableId: TASKS_ID,
                        queries: [
                            Query.equal("workspaceId", workspace.$id),
                            Query.equal("status", TaskStatus.DONE),
                            Query.limit(1),
                        ],
                    }),
                ]);

            const totalTasks = allTasks.total;
            const completedTasks = doneTasks.total;
            const pendingTasks = totalTasks - completedTasks;

            // 2. Gửi Email cho toan bo topic
            const htmlContent = `
        <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #1d1d1d;">📊 Weekly Report: ${workspace.name}</h2>
          <hr />
          <p>📁 <b>Total Projects:</b> ${projects.total}</p>
          <p>📝 <b>Total Tasks:</b> ${totalTasks}</p>
          <p>✅ <b>Completed:</b> ${completedTasks}</p>
          <p>⏳ <b>Pending:</b> ${pendingTasks}</p>
          <p style="color: red;">⚠️ <b>Overdue:</b> ${overdueTasks.total}</p>
        </div>
      `;

            try {
                await messaging.createEmail({
                    messageId: ID.unique(),
                    subject: `Weekly Report - ${workspace.name}`,
                    content: htmlContent,
                    topics: [`workspace_${workspace.$id}`],
                    html: true,
                });
                console.log(`✅ Sent report for: ${workspace.name}`);
            } catch (sendErr: any) {
                console.error(
                    `❌ Failed to send for ${workspace.name}: ${sendErr.message}`,
                );
            }
        }

        console.log("Job finished successfully");
    } catch (err: any) {
        console.error("Global Error: " + err.message);
    }
};
