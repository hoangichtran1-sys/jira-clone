import {
    DATABASES_ID,
    IMAGES_BUCKET_ID,
    PROJECTS_ID,
    TASKS_ID,
} from "@/config/appwrite";
import { getMember } from "@/features/members/utils";
import { sessionMiddleware } from "@/lib/session-middleware";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { createProjectSchema, updateProjectSchema } from "../schemas";
import { Project } from "../types";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { TaskStatus } from "@/features/tasks/types";
import { getCurrentProjects } from "../utils";
import { getCurrentSubscription } from "@/features/subscriptions/utils";
import { MAX_FREE_PROJECT } from "@/constants";
import { ably } from "@/lib/ably-rest";
import { MemberRole } from "@/features/members/types";
import { zodValidator } from "@/lib/zod-validator";

export function generateImageUrl(fileId: string) {
    const convertImageUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${IMAGES_BUCKET_ID}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

    return convertImageUrl;
}

const app = new Hono()
    .get(
        "/total-project-in-workspace",
        zodValidator(
            "query",
            z.object({
                workspaceId: z.string(),
            }),
        ),
        sessionMiddleware,
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { workspaceId } = c.req.valid("query");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                throw new HTTPException(401, { message: "Unauthorized" });
            }
            const currentProjectsInWorkspace = await getCurrentProjects({
                databases,
                workspaceId,
            });

            return c.json({ data: currentProjectsInWorkspace.length });
        },
    )
    .post(
        "/",
        sessionMiddleware,
        zodValidator("form", createProjectSchema),
        async (c) => {
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");

            const { name, image, workspaceId } = c.req.valid("form");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                throw new HTTPException(401, { message: "Unauthorized" });
            }

            const currentProjects = await getCurrentProjects({
                databases,
                workspaceId,
            });

            const currentSubscription = await getCurrentSubscription({
                databases,
                userId: user.$id,
            });

            const isFreeProjectLimitReached =
                currentProjects.length >= MAX_FREE_PROJECT;

            const shouldThrowProjectError =
                isFreeProjectLimitReached && !currentSubscription;

            if (shouldThrowProjectError) {
                throw new HTTPException(403, {
                    message:
                        "You have reached the maximum number of free projects",
                });
            }

            let uploadedImageUrl: string | undefined;
            let uploadedImageId: string | undefined;

            if (image instanceof File) {
                const file = await storage.createFile({
                    bucketId: IMAGES_BUCKET_ID,
                    fileId: ID.unique(),
                    file: image,
                });

                // const arrayBuffer = await storage.getFileView(
                //     IMAGES_BUCKET_ID,
                //     file.$id,
                // );

                // uploadedImageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString("base64")}`;
                uploadedImageUrl = generateImageUrl(file.$id);
                uploadedImageId = file.$id;
            }

            const project = await databases.createRow<Project>({
                databaseId: DATABASES_ID,
                tableId: PROJECTS_ID,
                rowId: ID.unique(),
                data: {
                    name,
                    imageUrl: uploadedImageUrl,
                    workspaceId,
                    imageId: uploadedImageId,
                },
            });

            // publish message
            const channel = ably.channels.get(
                `notification:workspace:${workspaceId}`,
            );

            await channel.publish("create-project", {
                userId: user.$id,
                workspaceId,
                message: `Project ${name} created`,
                project: project.$id,
                timestamp: new Date().toISOString(),
            });

            return c.json({ data: project });
        },
    )
    .get(
        "/",
        sessionMiddleware,
        zodValidator("query", z.object({ workspaceId: z.string() })),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { workspaceId } = c.req.valid("query");

            if (!workspaceId) {
                throw new HTTPException(400, {
                    message: "Missing workspace ID",
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

            const projects = await databases.listRows<Project>({
                databaseId: DATABASES_ID,
                tableId: PROJECTS_ID,
                queries: [
                    Query.equal("workspaceId", workspaceId),
                    Query.orderDesc("$createdAt"),
                ],
            });

            return c.json({ data: projects });
        },
    )
    .get("/:projectId", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { projectId } = c.req.param();

        const project = await databases.getRow<Project>({
            databaseId: DATABASES_ID,
            tableId: PROJECTS_ID,
            rowId: projectId,
        });

        const member = await getMember({
            databases,
            workspaceId: project.workspaceId,
            userId: user.$id,
        });

        if (!member) {
            throw new HTTPException(401, { message: "Unauthorized" });
        }

        return c.json({ data: project });
    })
    .patch(
        "/:projectId",
        sessionMiddleware,
        zodValidator("form", updateProjectSchema),
        async (c) => {
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");

            const { projectId } = c.req.param();
            const { name, image } = c.req.valid("form");

            const existingProject = await databases.getRow<Project>({
                databaseId: DATABASES_ID,
                tableId: PROJECTS_ID,
                rowId: projectId,
            });

            const member = await getMember({
                databases,
                workspaceId: existingProject.workspaceId,
                userId: user.$id,
            });

            if (!member) {
                throw new HTTPException(401, { message: "Unauthorized" });
            }

            let uploadedImageUrl: string | undefined;
            let uploadedImageId: string | undefined;

            if (image instanceof File) {
                const file = await storage.createFile({
                    bucketId: IMAGES_BUCKET_ID,
                    fileId: ID.unique(),
                    file: image,
                });

                // const arrayBuffer = await storage.getFileView(
                //     IMAGES_BUCKET_ID,
                //     file.$id,
                // );

                // uploadedImageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString("base64")}`;
                uploadedImageUrl = generateImageUrl(file.$id);
                uploadedImageId = file.$id;
            } else {
                uploadedImageUrl = image;
            }

            const project = await databases.updateRow<Project>({
                databaseId: DATABASES_ID,
                tableId: PROJECTS_ID,
                rowId: projectId,
                data: {
                    name,
                    imageUrl: uploadedImageUrl,
                    imageId: uploadedImageId,
                },
            });

            return c.json({ data: project });
        },
    )
    .delete("/:projectId", sessionMiddleware, async (c) => {
        const databases = c.get("databases");
        const storage = c.get("storage");
        const user = c.get("user");

        const { projectId } = c.req.param();

        const existingProject = await databases.getRow<Project>({
            databaseId: DATABASES_ID,
            tableId: PROJECTS_ID,
            rowId: projectId,
        });

        const member = await getMember({
            databases,
            workspaceId: existingProject.workspaceId,
            userId: user.$id,
        });

        if (!member) {
            throw new HTTPException(401, { message: "Unauthorized" });
        }

        if (member.role !== MemberRole.ADMIN) {
            throw new HTTPException(403, { message: "Forbidden" });
        }
        // DELETE tasks
        const tx = await databases.createTransaction();
        await databases.deleteRows({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [Query.equal("projectId", projectId)],
            transactionId: tx.$id,
        });

        // Delete file upload in storage
        if (existingProject.imageId) {
            await storage.deleteFile({
                bucketId: IMAGES_BUCKET_ID,
                fileId: existingProject.imageId,
            });
        }

        await databases.deleteRow({
            databaseId: DATABASES_ID,
            tableId: PROJECTS_ID,
            rowId: projectId,
            transactionId: tx.$id,
        });

        // publish message
        const channel = ably.channels.get(
            `notification:workspace:${existingProject.workspaceId}`,
        );

        await channel.publish("delete-project", {
            userId: user.$id,
            workspaceId: existingProject.workspaceId,
            message: `Project ${existingProject.name} deleted`,
            project: existingProject.$id,
            timestamp: new Date().toISOString(),
        });

        return c.json({
            data: {
                $id: existingProject.$id,
                workspaceId: existingProject.workspaceId,
            },
        });
    })
    .get("/:projectId/analytics", sessionMiddleware, async (c) => {
        const databases = c.get("databases");
        const user = c.get("user");

        const { projectId } = c.req.param();

        const project = await databases.getRow<Project>({
            databaseId: DATABASES_ID,
            tableId: PROJECTS_ID,
            rowId: projectId,
        });

        const member = await getMember({
            databases,
            workspaceId: project.workspaceId,
            userId: user.$id,
        });

        if (!member) {
            throw new HTTPException(401, { message: "Unauthorized" });
        }

        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const thisMonthEnd = endOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        const thisMonthTasks = await databases.listRows({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("projectId", projectId),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        });

        const lastMonthTasks = await databases.listRows({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("projectId", projectId),
                Query.greaterThanEqual(
                    "$createdAt",
                    lastMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
            ],
        });

        const taskCount = thisMonthTasks.total;
        const taskDifference = taskCount - lastMonthTasks.total;

        const thisMonthAssignedTasks = await databases.listRows({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("projectId", projectId),
                Query.equal("assigneeId", member.$id),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        });

        const lastMonthAssignedTasks = await databases.listRows({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("projectId", projectId),
                Query.equal("assigneeId", member.$id),
                Query.greaterThanEqual(
                    "$createdAt",
                    lastMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
            ],
        });

        const assignedTaskCount = thisMonthAssignedTasks.total;
        const assignedTaskDifference =
            assignedTaskCount - lastMonthAssignedTasks.total;

        const thisMonthIncompleteTasks = await databases.listRows({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("projectId", projectId),
                Query.notEqual("status", TaskStatus.DONE),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        });

        const lastMonthIncompleteTasks = await databases.listRows({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("projectId", projectId),
                Query.notEqual("status", TaskStatus.DONE),
                Query.greaterThanEqual(
                    "$createdAt",
                    lastMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
            ],
        });

        const incompleteTaskCount = thisMonthIncompleteTasks.total;
        const incompleteTaskDifference =
            incompleteTaskCount - lastMonthIncompleteTasks.total;

        const thisMonthCompletedTasks = await databases.listRows({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("projectId", projectId),
                Query.equal("status", TaskStatus.DONE),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        });

        const lastMonthCompletedTasks = await databases.listRows({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("projectId", projectId),
                Query.equal("status", TaskStatus.DONE),
                Query.greaterThanEqual(
                    "$createdAt",
                    lastMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
            ],
        });

        const completedTaskCount = thisMonthCompletedTasks.total;
        const completedTaskDifference =
            completedTaskCount - lastMonthCompletedTasks.total;

        const thisMonthOverdueTasks = await databases.listRows({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("projectId", projectId),
                Query.notEqual("status", TaskStatus.DONE),
                Query.lessThan("dueDate", now.toISOString()),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        });

        const lastMonthOverdueTasks = await databases.listRows({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("projectId", projectId),
                Query.notEqual("status", TaskStatus.DONE),
                Query.lessThan("dueDate", now.toISOString()),
                Query.greaterThanEqual(
                    "$createdAt",
                    lastMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
            ],
        });

        const overdueTaskCount = thisMonthOverdueTasks.total;
        const overdueTaskDifference =
            overdueTaskCount - lastMonthOverdueTasks.total;

        return c.json({
            data: {
                taskCount,
                taskDifference,
                assignedTaskCount,
                assignedTaskDifference,
                completedTaskCount,
                completedTaskDifference,
                incompleteTaskCount,
                incompleteTaskDifference,
                overdueTaskCount,
                overdueTaskDifference,
            },
        });
    });

export default app;
