/* eslint-disable @typescript-eslint/no-explicit-any */
import { TaskStatus } from "@/features/tasks/types";
import { Workspace } from "@/features/workspaces/types";
import { Query, ID } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { getAppwriteEnv } from "../env";

export const processReportJob = async () => {
    const { DATABASES_ID, TASKS_ID, WORKSPACES_ID, PROJECTS_ID } =
        getAppwriteEnv();
    try {
        const { databases, messaging } = await createAdminClient();

        const now = new Date().toISOString();

        // 1. Lấy tất cả workspace
        const workspaces = await databases.listDocuments<Workspace>(
            DATABASES_ID,
            WORKSPACES_ID,
            [Query.limit(1000)],
        );

        for (const workspace of workspaces.documents) {
            // Sử dụng Promise.all để lấy 3 loại dữ liệu
            const [allTasks, projects, overdueTasks, doneTasks] =
                await Promise.all([
                    // Tổng số task
                    databases.listDocuments(DATABASES_ID, TASKS_ID, [
                        Query.equal("workspaceId", workspace.$id),
                        Query.limit(1),
                    ]),
                    // Tổng số project
                    databases.listDocuments(DATABASES_ID, PROJECTS_ID, [
                        Query.equal("workspaceId", workspace.$id),
                        Query.limit(1),
                    ]),
                    // Task quá hạn
                    databases.listDocuments(DATABASES_ID, TASKS_ID, [
                        Query.equal("workspaceId", workspace.$id),
                        Query.notEqual("status", TaskStatus.DONE),
                        Query.lessThan("dueDate", now),
                        Query.limit(1),
                    ]),
                    // Task đã xong
                    databases.listDocuments(DATABASES_ID, TASKS_ID, [
                        Query.equal("workspaceId", workspace.$id),
                        Query.equal("status", TaskStatus.DONE),
                        Query.limit(1),
                    ]),
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
                await messaging.createEmail(
                    ID.unique(),
                    `Weekly Report - ${workspace.name}`,
                    htmlContent,
                    [`workspace_${workspace.$id}`],
                    [],
                    [],
                );
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
