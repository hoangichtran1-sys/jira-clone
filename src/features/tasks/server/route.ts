import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
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

const app = new Hono()
    .delete("/:taskId", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { taskId } = c.req.param();

        const taskToDelete = await databases.getDocument<Task>(
            DATABASES_ID,
            TASKS_ID,
            taskId,
        );

        const member = await getMember({
            databases,
            workspaceId: taskToDelete.workspaceId,
            userId: user.$id,
        });

        if (!member) {
            return c.json({ error: "Unauthorized " }, 401);
        }

        await databases.deleteDocument(DATABASES_ID, TASKS_ID, taskId);

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
        zValidator(
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
                return c.json({ error: "Unauthorized " }, 401);
            }

            const query = [
                Query.equal("workspaceId", workspaceId),
                Query.orderDesc("$createdAt"),
            ];

            if (projectId) {
                console.log("projectId", projectId);
                query.push(Query.equal("projectId", projectId));
            }

            if (status) {
                console.log("status", status);
                query.push(Query.equal("status", status));
            }

            if (assigneeId) {
                console.log("assigneeId", assigneeId);
                query.push(Query.equal("assigneeId", assigneeId));
            }

            if (dueDate) {
                console.log("dueDate", dueDate);
                query.push(Query.equal("dueDate", dueDate));
            }

            if (search) {
                console.log("search", search);
                query.push(Query.equal("name", search));
            }

            const tasks = await databases.listDocuments<Task>(
                DATABASES_ID,
                TASKS_ID,
                query,
            );

            const projectIds = tasks.documents.map((task) => task.projectId);
            const assigneeIds = tasks.documents.map((task) => task.assigneeId);

            const projects = await databases.listDocuments<Project>(
                DATABASES_ID,
                PROJECTS_ID,
                projectIds.length > 0
                    ? [Query.contains("$id", projectIds)]
                    : [],
            );

            const members = await databases.listDocuments<Member>(
                DATABASES_ID,
                MEMBERS_ID,
                assigneeIds.length > 0
                    ? [Query.contains("$id", assigneeIds)]
                    : [],
            );

            const assignees = await Promise.all(
                members.documents.map(async (member) => {
                    const user = await users.get(member.userId);

                    return {
                        ...member,
                        name: user.name || user.email,
                        email: user.email,
                    };
                }),
            );

            const populatedTasks = tasks.documents.map((task) => {
                const project = projects.documents.find(
                    (project) => project.$id === task.projectId,
                );
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
        zValidator("json", createTaskSchema),
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
                return c.json({ error: "Unauthorized " }, 401);
            }

            const highestPositionTask = await databases.listDocuments(
                DATABASES_ID,
                TASKS_ID,
                [
                    Query.equal("status", status),
                    Query.equal("workspaceId", workspaceId),
                    Query.orderAsc("position"),
                    Query.limit(1),
                ],
            );

            const newPosition =
                highestPositionTask.documents.length > 0
                    ? highestPositionTask.documents[0].position + 1000
                    : 1000;

            const task = await databases.createDocument<Task>(
                DATABASES_ID,
                TASKS_ID,
                ID.unique(),
                {
                    name,
                    status,
                    workspaceId,
                    projectId,
                    dueDate,
                    description: description || "",
                    assigneeId,
                    position: newPosition,
                },
            );

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
        zValidator("json", updateTaskSchema),
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

            const existingTask = await databases.getDocument<Task>(
                DATABASES_ID,
                TASKS_ID,
                taskId,
            );

            const member = await getMember({
                databases,
                workspaceId: existingTask.workspaceId,
                userId: user.$id,
            });

            if (!member) {
                return c.json({ error: "Unauthorized " }, 401);
            }

            const task = await databases.updateDocument<Task>(
                DATABASES_ID,
                TASKS_ID,
                taskId,
                {
                    name,
                    status,
                    projectId,
                    dueDate,
                    description: description || "",
                    assigneeId,
                },
            );

            return c.json({ data: task });
        },
    )
    .get("/:taskId", sessionMiddleware, async (c) => {
        const currentUser = c.get("user");
        const databases = c.get("databases");
        const { users } = await createAdminClient();
        const { taskId } = c.req.param();

        const task = await databases.getDocument<Task>(
            DATABASES_ID,
            TASKS_ID,
            taskId,
        );

        const currentMember = await getMember({
            databases,
            workspaceId: task.workspaceId,
            userId: currentUser.$id,
        });

        if (!currentMember) {
            return c.json({ error: "Unauthorized " }, 401);
        }

        const project = await databases.getDocument<Project>(
            DATABASES_ID,
            PROJECTS_ID,
            task.projectId,
        );

        const member = await databases.getDocument<Member>(
            DATABASES_ID,
            MEMBERS_ID,
            task.assigneeId,
        );

        const user = await users.get(member.userId);

        const assignee = {
            ...member,
            name: user.name || user.email,
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
        zValidator(
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

            const tasksToUpdate = await databases.listDocuments<Task>(
                DATABASES_ID,
                TASKS_ID,
                [
                    Query.contains(
                        "$id",
                        tasks.map((task) => task.$id),
                    ),
                ],
            );

            const workspaceIds = new Set(
                tasksToUpdate.documents.map((task) => task.workspaceId),
            );

            if (workspaceIds.size !== 1) {
                return c.json(
                    { error: "All tasks must belong to the same workspace" },
                    400,
                );
            }

            const workspaceId = workspaceIds.values().next().value;

            if (!workspaceId) {
                return c.json({ error: "Not found" }, 404);
            }

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                return c.json({ error: "Unauthorized " }, 401);
            }

            const updatedTasks = await Promise.all(
                tasks.map(async (task) => {
                    const { $id, status, position } = task;
                    return databases.updateDocument<Task>(
                        DATABASES_ID,
                        TASKS_ID,
                        $id,
                        {
                            status,
                            position,
                        },
                    );
                }),
            );

            return c.json({ data: updatedTasks });
        },
    )
    .post(
        "/bulk-delete",
        sessionMiddleware,
        zValidator(
            "json",
            z.object({
                taskIds: z.array(z.string()),
            }),
        ),
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const { taskIds } = c.req.valid("json");

            const tasksToDelete = await databases.listDocuments<Task>(
                DATABASES_ID,
                TASKS_ID,
                [Query.contains("$id", taskIds)],
            );

            const workspaceIds = new Set(
                tasksToDelete.documents.map((task) => task.workspaceId),
            );

            if (workspaceIds.size !== 1) {
                return c.json(
                    { error: "All tasks must belong to the same workspace" },
                    400,
                );
            }

            const workspaceId = workspaceIds.values().next().value;

            if (!workspaceId) {
                return c.json({ error: "Not found" }, 404);
            }

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                return c.json({ error: "Unauthorized " }, 401);
            }

            await Promise.all(
                taskIds.map((taskId) =>
                    databases.deleteDocument(DATABASES_ID, TASKS_ID, taskId),
                ),
            );

            return c.json({
                data: tasksToDelete.documents.map((task) => task.$id),
            });
        },
    );

export default app;
