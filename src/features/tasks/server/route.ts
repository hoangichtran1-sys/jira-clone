import { sessionMiddleware } from "@/lib/session-middleware";
import { HTTPException } from "hono/http-exception";
import { Hono } from "hono";
import { createTaskSchema, updateTaskSchema } from "../schemas";
import { getMember } from "@/features/members/utils";
import {
    DATABASES_ID,
    MEMBERS_ID,
    PROJECTS_ID,
    TASKS_ID,
} from "@/config/appwrite";
import { ID, Query } from "node-appwrite";
import { z } from "zod";
import { Task, TaskStatus } from "../types";
import { createAdminClient } from "@/lib/appwrite";
import { Project } from "@/features/projects/types";
import { Member } from "@/features/members/types";
import { ably } from "@/lib/ably-rest";
import { zodValidator } from "@/lib/zod-validator";

const app = new Hono()
    .delete("/:taskId", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { taskId } = c.req.param();

        const taskToDelete = await databases.getRow<Task>({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            rowId: taskId,
        });

        const member = await getMember({
            databases,
            workspaceId: taskToDelete.workspaceId,
            userId: user.$id,
        });

        if (!member) {
            throw new HTTPException(401, { message: "Unauthorized" });
        }

        await databases.deleteRow({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            rowId: taskId,
        });

        // publish message
        const channel = ably.channels.get(
            `notification:workspace:${taskToDelete.workspaceId}`,
        );

        await channel.publish("delete-task", {
            userId: user.$id,
            workspaceId: taskToDelete.workspaceId,
            message: `Task ${taskToDelete.name} deleted`,
            project: taskToDelete.projectId,
            task: taskToDelete.$id,
            timestamp: new Date().toISOString(),
        });

        return c.json({ data: { $id: taskToDelete.$id } });
    })
    .get(
        "/",
        sessionMiddleware,
        zodValidator(
            "query",
            z.object({
                workspaceId: z.string(),
                projectId: z.string().nullish(),
                assigneeId: z.string().nullish(),
                status: z.nativeEnum(TaskStatus).nullish(),
                search: z.string().nullish(),
                dueDate: z.string().nullish(), // Check type string or date
            }),
        ),
        async (c) => {
            const { users } = await createAdminClient();
            const user = c.get("user");
            const databases = c.get("databases");
            const {
                status,
                workspaceId,
                projectId,
                dueDate,
                assigneeId,
                search,
            } = c.req.valid("query");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                throw new HTTPException(401, { message: "Unauthorized" });
            }

            const queries = [
                Query.equal("workspaceId", workspaceId),
                Query.orderDesc("$createdAt"),
            ];

            if (projectId) {
                console.log("projectId", projectId);
                queries.push(Query.equal("projectId", projectId));
            }

            if (status) {
                console.log("status", status);
                queries.push(Query.equal("status", status));
            }

            if (assigneeId) {
                console.log("assigneeId", assigneeId);
                queries.push(Query.equal("assigneeId", assigneeId));
            }

            if (dueDate) {
                console.log("dueDate", dueDate);
                queries.push(Query.equal("dueDate", dueDate));
            }

            if (search) {
                console.log("search", search);
                queries.push(Query.equal("name", search));
            }

            const tasks = await databases.listRows<Task>({
                databaseId: DATABASES_ID,
                tableId: TASKS_ID,
                queries,
            });

            const projectIds = tasks.rows.map((task) => task.projectId);
            const assigneeIds = tasks.rows.map((task) => task.assigneeId);

            const projects = await databases.listRows<Project>({
                databaseId: DATABASES_ID,
                tableId: PROJECTS_ID,
                queries:
                    projectIds.length > 0
                        ? [Query.contains("$id", projectIds)]
                        : [],
            });

            const members = await databases.listRows<Member>({
                databaseId: DATABASES_ID,
                tableId: MEMBERS_ID,
                queries:
                    assigneeIds.length > 0
                        ? [Query.contains("$id", assigneeIds)]
                        : [],
            });

            const assignees = await Promise.all(
                members.rows.map(async (member) => {
                    const user = await users.get({ userId: member.userId });

                    return {
                        ...member,
                        name: user.name,
                        email: user.email,
                    };
                }),
            );

            const populatedTasks = tasks.rows.map((task) => {
                const project = projects.rows.find(
                    (project) => project.$id === task.projectId,
                )!;
                const assignee = assignees.find(
                    (assignee) => assignee.$id === task.assigneeId,
                );

                return {
                    ...task,
                    project,
                    assignee,
                };
            });

            return c.json({
                data: {
                    ...tasks,
                    documents: populatedTasks,
                },
            });
        },
    )
    .post(
        "/",
        sessionMiddleware,
        zodValidator("json", createTaskSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const {
                name,
                status,
                workspaceId,
                projectId,
                dueDate,
                assigneeId,
                description,
            } = c.req.valid("json");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                throw new HTTPException(401, { message: "Unauthorized" });
            }

            const highestPositionTask = await databases.listRows({
                databaseId: DATABASES_ID,
                tableId: TASKS_ID,
                queries: [
                    Query.equal("status", status),
                    Query.equal("workspaceId", workspaceId),
                    Query.orderAsc("position"),
                    Query.limit(1),
                ],
            });

            const newPosition =
                highestPositionTask.rows.length > 0
                    ? highestPositionTask.rows[0].position + 1000
                    : 1000;

            const task = await databases.createRow<Task>({
                databaseId: DATABASES_ID,
                tableId: TASKS_ID,
                rowId: ID.unique(),
                data: {
                    name,
                    status,
                    workspaceId,
                    projectId,
                    dueDate: dueDate.toISOString(),
                    description: description || "",
                    assigneeId,
                    position: newPosition,
                },
            });

            // publish message
            const channel = ably.channels.get(
                `notification:workspace:${workspaceId}`,
            );

            await channel.publish("create-task", {
                userId: user.$id,
                workspaceId,
                message: `Task ${name} created`,
                project: projectId,
                timestamp: new Date().toISOString(),
            });

            return c.json({ data: task });
        },
    )
    .patch(
        "/:taskId",
        sessionMiddleware,
        zodValidator("json", updateTaskSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { taskId } = c.req.param();
            const {
                name,
                status,
                projectId,
                dueDate,
                assigneeId,
                description,
            } = c.req.valid("json");

            const existingTask = await databases.getRow<Task>({
                databaseId: DATABASES_ID,
                tableId: TASKS_ID,
                rowId: taskId,
            });

            const member = await getMember({
                databases,
                workspaceId: existingTask.workspaceId,
                userId: user.$id,
            });

            if (!member) {
                throw new HTTPException(401, { message: "Unauthorized" });
            }

            const task = await databases.updateRow<Task>({
                databaseId: DATABASES_ID,
                tableId: TASKS_ID,
                rowId: taskId,
                data: {
                    name,
                    status,
                    projectId,
                    dueDate: dueDate?.toISOString(),
                    description: description || "",
                    assigneeId,
                },
            });

            return c.json({ data: task });
        },
    )
    .get("/:taskId", sessionMiddleware, async (c) => {
        const currentUser = c.get("user");
        const databases = c.get("databases");
        const { users } = await createAdminClient();
        const { taskId } = c.req.param();

        const task = await databases.getRow<Task>({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            rowId: taskId,
        });

        const currentMember = await getMember({
            databases,
            workspaceId: task.workspaceId,
            userId: currentUser.$id,
        });

        if (!currentMember) {
            throw new HTTPException(401, { message: "Unauthorized" });
        }

        const project = await databases.getRow<Project>({
            databaseId: DATABASES_ID,
            tableId: PROJECTS_ID,
            rowId: task.projectId,
        });

        const member = await databases.getRow<Member>({
            databaseId: DATABASES_ID,
            tableId: MEMBERS_ID,
            rowId: task.assigneeId,
        });

        const user = await users.get({ userId: member.userId });

        const assignee = {
            ...member,
            name: user.name,
            email: user.email,
        };

        return c.json({
            data: {
                ...task,
                project,
                assignee,
            },
        });
    })
    .post(
        "/bulk-update",
        sessionMiddleware,
        zodValidator(
            "json",
            z.object({
                tasks: z.array(
                    z.object({
                        $id: z.string(),
                        status: z.nativeEnum(TaskStatus),
                        position: z
                            .number()
                            .int()
                            .positive()
                            .min(1000)
                            .max(1_000_000),
                    }),
                ),
            }),
        ),
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const { tasks } = c.req.valid("json");

            const tasksToUpdate = await databases.listRows<Task>({
                databaseId: DATABASES_ID,
                tableId: TASKS_ID,
                queries: [
                    Query.contains(
                        "$id",
                        tasks.map((task) => task.$id),
                    ),
                ],
            });

            const workspaceIds = new Set(
                tasksToUpdate.rows.map((task) => task.workspaceId),
            );

            if (workspaceIds.size !== 1) {
                throw new HTTPException(400, {
                    message: "All tasks must belong to the same workspace",
                });
            }

            const workspaceId = workspaceIds.values().next().value;

            if (!workspaceId) {
                throw new HTTPException(404, {
                    message: "Workspace not found",
                });
            }

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                throw new HTTPException(401, { message: "Unauthorized" });
            }
            const tx = await databases.createTransaction();
            const updatedTasks = await Promise.all(
                tasks.map(async (task) => {
                    const { $id, status, position } = task;
                    return databases.updateRow<Task>({
                        databaseId: DATABASES_ID,
                        tableId: TASKS_ID,
                        rowId: $id,
                        data: {
                            status,
                            position,
                        },
                        transactionId: tx.$id,
                    });
                }),
            );

            return c.json({ data: updatedTasks });
        },
    )
    .post(
        "/bulk-delete",
        sessionMiddleware,
        zodValidator(
            "json",
            z.object({
                taskIds: z.array(z.string()),
            }),
        ),
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const { taskIds } = c.req.valid("json");

            const tasksToDelete = await databases.listRows<Task>({
                databaseId: DATABASES_ID,
                tableId: TASKS_ID,
                queries: [Query.contains("$id", taskIds)],
            });

            const workspaceIds = new Set(
                tasksToDelete.rows.map((task) => task.workspaceId),
            );

            if (workspaceIds.size !== 1) {
                throw new HTTPException(400, {
                    message: "All tasks must belong to the same workspace",
                });
            }

            const workspaceId = workspaceIds.values().next().value;

            if (!workspaceId) {
                throw new HTTPException(404, {
                    message: "Workspace not found",
                });
            }

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                throw new HTTPException(401, { message: "Unauthorized" });
            }

            databases.deleteRows({
                databaseId: DATABASES_ID,
                tableId: TASKS_ID,
                queries: [Query.contains("taskId", taskIds)],
            });

            return c.json({
                data: tasksToDelete.rows.map((task) => task.$id),
            });
        },
    );

export default app;
