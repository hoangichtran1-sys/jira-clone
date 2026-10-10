import { Hono } from "hono";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import { tasks } from "@trigger.dev/sdk";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { createWorkspaceSchema, updateWorkspaceSchema } from "../schemas";
import { sessionMiddleware } from "@/lib/session-middleware";
import {
    DATABASES_ID,
    IMAGES_BUCKET_ID,
    MEMBERS_ID,
    PROJECTS_ID,
    TASKS_ID,
    WORKSPACES_ID,
} from "@/config/appwrite";
import { ID, Query } from "node-appwrite";
import { Member, MemberRole } from "@/features/members/types";
import { generateInviteCode } from "@/lib/utils";
import { getMember } from "@/features/members/utils";
import { Workspace } from "../types";
import { Task, TaskStatus } from "@/features/tasks/types";
import {
    ensureEmailTarget,
    getCurrentWorkspacesIsAdmin,
    validateEmail,
} from "../utils";
import { MAX_FREE_WORKSPACE } from "@/constants";
import { getCurrentSubscription } from "@/features/subscriptions/utils";
import { render } from "@react-email/render";
import { InviteEmail } from "../emails/invite-email";
import { createAdminClient } from "@/lib/appwrite";
import { ably } from "@/lib/ably-rest";
import type {
    sendEmailInvitation,
    sendEmailDeleteWorkspace,
} from "@/trigger/send-mail-tasks";
import WorkspaceDeletedEmail from "../emails/workspace-delete-email";
import { zodValidator } from "@/lib/zod-validator";
import { Project } from "@/features/projects/types";

export function generateImageUrl(fileId: string) {
    const convertImageUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${IMAGES_BUCKET_ID}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

    return convertImageUrl;
}

const app = new Hono()
    .post(
        "/send-email-invitation",
        zodValidator(
            "query",
            z.object({
                workspaceId: z.string(),
            }),
        ),
        zodValidator(
            "json",
            z.object({
                title: z.string().min(1, "Title is required"),
                link: z.string().min(1, "Link is required"),
                emailTo: z.string().email(),
            }),
        ),
        sessionMiddleware,
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { title, link, emailTo } = c.req.valid("json");
            const { workspaceId } = c.req.valid("query");

            const { valid, reason } = await validateEmail(emailTo);

            if (!valid) {
                throw new HTTPException(400, {
                    message: `Email invalid ${reason}`,
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

            const currentSubscription = await getCurrentSubscription({
                databases,
                userId: user.$id,
            });

            if (!currentSubscription) {
                throw new HTTPException(403, {
                    message: "You need to upgrade your account to premium",
                });
            }

            const react = await render(
                <InviteEmail
                    title={title}
                    link={link}
                    sentTime={new Date().toLocaleString()}
                />,
            );

            const handle = await tasks.trigger<typeof sendEmailInvitation>(
                "send-email-invitation",
                {
                    from: `"Workspace member" <${user.email}>`,
                    email: emailTo,
                    subject: title,
                    html: react,
                },
            );

            console.log(handle);

            return c.json({ data: "Send email successfully" });
        },
    )
    .get("/total-workspace-create", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");

        const currentWorkspacesCreate = await getCurrentWorkspacesIsAdmin({
            databases,
            userId: user.$id,
        });

        return c.json({ data: currentWorkspacesCreate.length });
    })
    .get("/", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");

        const members = await databases.listRows<Member>({
            databaseId: DATABASES_ID,
            tableId: MEMBERS_ID,
            queries: [Query.equal("userId", user.$id)],
        });

        if (members.total === 0) {
            return c.json({ data: { rows: [], total: 0 } });
        }

        const workspaceIds = members.rows.map((member) => member.workspaceId);

        const workspaces = await databases.listRows<Workspace>({
            databaseId: DATABASES_ID,
            tableId: WORKSPACES_ID,
            queries: [
                Query.orderDesc("$createdAt"),
                Query.contains("$id", workspaceIds),
            ],
        });

        return c.json({ data: workspaces });
    })
    .get("/:workspaceId", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { workspaceId } = c.req.param();

        const member = await getMember({
            databases,
            workspaceId,
            userId: user.$id,
        });

        if (!member) {
            throw new HTTPException(401, { message: "Unauthorized" });
        }

        const workspace = await databases.getRow<Workspace>({
            databaseId: DATABASES_ID,
            tableId: WORKSPACES_ID,
            rowId: workspaceId,
        });

        return c.json({ data: workspace });
    })
    .get("/:workspaceId/info", sessionMiddleware, async (c) => {
        const databases = c.get("databases");
        const { users } = await createAdminClient();

        const { workspaceId } = c.req.param();

        const workspaceInfo = await databases.getRow<Workspace>({
            databaseId: DATABASES_ID,
            tableId: WORKSPACES_ID,
            rowId: workspaceId,
        });

        const membersInfo = await databases.listRows<Member>({
            databaseId: DATABASES_ID,
            tableId: MEMBERS_ID,
            queries: [Query.equal("workspaceId", workspaceId)],
        });

        const membersInfoPopulated = await Promise.all(
            membersInfo.rows.map(async (member) => {
                const user = await users.get({ userId: member.userId });

                return {
                    role: member.role,
                    userId: member.userId,
                    name: user.name,
                    email: user.email,
                };
            }),
        );

        return c.json({
            data: {
                name: workspaceInfo.name,
                imageUrl: workspaceInfo.imageUrl,
                members: membersInfoPopulated,
            },
        });
    })
    .post(
        "/",
        sessionMiddleware,
        zodValidator("form", createWorkspaceSchema),
        async (c) => {
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");
            const { messaging } = await createAdminClient();

            const { name, image } = c.req.valid("form");

            const currentWorkspaces = await getCurrentWorkspacesIsAdmin({
                databases,
                userId: user.$id,
            });

            const currentSubscription = await getCurrentSubscription({
                databases,
                userId: user.$id,
            });

            const isFreeWorkspaceLimitReached =
                currentWorkspaces.length >= MAX_FREE_WORKSPACE;

            const shouldThrowWorkspaceError =
                isFreeWorkspaceLimitReached && !currentSubscription;

            if (shouldThrowWorkspaceError) {
                throw new HTTPException(403, {
                    message:
                        "You have reached the maximum number of free workspaces",
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

            const workspace = await databases.createRow<Workspace>({
                databaseId: DATABASES_ID,
                tableId: WORKSPACES_ID,
                rowId: ID.unique(),
                data: {
                    name,
                    userId: user.$id,
                    imageUrl: uploadedImageUrl,
                    imageId: uploadedImageId,
                    inviteCode: generateInviteCode(6),
                },
            });

            await messaging.createTopic({
                topicId: `workspace_${workspace.$id}`,
                name: workspace.name,
            });

            const targetId = await ensureEmailTarget({
                databases,
                userId: user.$id,
            });

            if (!targetId) {
                throw new HTTPException(400, {
                    message: "Failed to get target ID",
                });
            }

            const subscriber = await messaging.createSubscriber({
                topicId: `workspace_${workspace.$id}`,
                subscriberId: ID.unique(),
                targetId,
            });

            if (!subscriber) {
                throw new HTTPException(400, {
                    message: "Failed to create subscriber",
                });
            }

            await databases.createRow({
                databaseId: DATABASES_ID,
                tableId: MEMBERS_ID,
                rowId: ID.unique(),
                data: {
                    userId: user.$id,
                    workspaceId: workspace.$id,
                    role: MemberRole.ADMIN,
                    subscriberId: subscriber.$id,
                },
            });

            return c.json({ data: workspace });
        },
    )
    .patch(
        "/:workspaceId",
        sessionMiddleware,
        zodValidator("form", updateWorkspaceSchema),
        async (c) => {
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");

            const { workspaceId } = c.req.param();
            const { name, image } = c.req.valid("form");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member || member.role !== MemberRole.ADMIN) {
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

            const workspace = await databases.updateRow<Workspace>({
                databaseId: DATABASES_ID,
                tableId: WORKSPACES_ID,
                rowId: workspaceId,
                data: {
                    name,
                    imageUrl: uploadedImageUrl,
                    imageId: uploadedImageId,
                },
            });

            return c.json({ data: workspace });
        },
    )
    .delete("/:workspaceId", sessionMiddleware, async (c) => {
        const databases = c.get("databases");
        const storage = c.get("storage");
        const user = c.get("user");
        const { messaging, users } = await createAdminClient();

        const { workspaceId } = c.req.param();

        const member = await getMember({
            databases,
            workspaceId,
            userId: user.$id,
        });

        if (!member || member.role !== MemberRole.ADMIN) {
            throw new HTTPException(401, { message: "Unauthorized" });
        }

        const workspaceToDelete = await databases.getRow<Workspace>({
            databaseId: DATABASES_ID,
            tableId: WORKSPACES_ID,
            rowId: workspaceId,
        });

        // TODO: use trigger.dev DELETE members, projects , topic and tasks and file in storage
        const tx = await databases.createTransaction();
        const membersToDelete = await databases.listRows<Member>({
            databaseId: DATABASES_ID,
            tableId: MEMBERS_ID,
            queries: [Query.equal("workspaceId", workspaceId)],
            transactionId: tx.$id,
        });

        const projectsToDelete = await databases.listRows<Project>({
            databaseId: DATABASES_ID,
            tableId: PROJECTS_ID,
            queries: [Query.equal("workspaceId", workspaceId)],
            transactionId: tx.$id,
        });

        const populatedMembersToDelete = await Promise.all(
            membersToDelete.rows.map(async (member) => {
                const user = await users.get({ userId: member.userId });

                return {
                    ...member,
                    email: user.email,
                };
            }),
        );

        const react = await render(
            <WorkspaceDeletedEmail
                workspaceName={workspaceToDelete.name}
                deletedBy={user.email}
                deletedAt={new Date().toLocaleString()}
            />,
        );

        if (populatedMembersToDelete.length > 0) {
            await Promise.all(
                populatedMembersToDelete.map((member) => {
                    // co the ko can gui cho chinh minh tuc nguoi da tao ra workspace do
                    tasks.trigger<typeof sendEmailDeleteWorkspace>(
                        "send-email-delete-workspace",
                        {
                            from: `"Workspace admin" <${user.email}>`,
                            email: member.email,
                            subject: `Workspace "${workspaceToDelete.name}" deleted`,
                            html: react,
                        },
                    );
                }),
            );
        }

        await databases.deleteRows({
            databaseId: DATABASES_ID,
            tableId: MEMBERS_ID,
            queries: [Query.equal("workspaceId", workspaceId)],
            transactionId: tx.$id,
        });

        // DELETE file storage in projects
        await Promise.all(
            projectsToDelete.rows.map(async (project) => {
                if (project.imageId) {
                    await storage.deleteFile({
                        bucketId: IMAGES_BUCKET_ID,
                        fileId: project.imageId,
                    });
                }
            }),
        );

        await databases.deleteRows({
            databaseId: DATABASES_ID,
            tableId: PROJECTS_ID,
            queries: [Query.equal("workspaceId", workspaceId)],
            transactionId: tx.$id,
        });

        await databases.deleteRows({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [Query.equal("workspaceId", workspaceId)],
            transactionId: tx.$id,
        });

        await messaging.deleteTopic({ topicId: `workspace_${workspaceId}` });

        // DELETE file storage in workspace
        if (workspaceToDelete.imageId) {
            await storage.deleteFile({
                bucketId: IMAGES_BUCKET_ID,
                fileId: workspaceToDelete.imageId,
            });
        }

        await databases.deleteRow({
            databaseId: DATABASES_ID,
            tableId: WORKSPACES_ID,
            rowId: workspaceId,
            transactionId: tx.$id,
        });

        // publish message
        const channel = ably.channels.get(
            `notification:workspace:${workspaceId}`,
        );
        await channel.publish("delete-workspace", {
            userId: user.$id,
            workspaceId,
            message: `Workspace "${workspaceToDelete.name}" deleted by ${user.email}`,
            timestamp: new Date().toISOString(),
        });

        return c.json({ data: { $id: workspaceId } });
    })
    .post("/:workspaceId/reset-invite-code", sessionMiddleware, async (c) => {
        const databases = c.get("databases");
        const user = c.get("user");

        const { workspaceId } = c.req.param();

        const member = await getMember({
            databases,
            workspaceId,
            userId: user.$id,
        });

        if (!member || member.role !== MemberRole.ADMIN) {
            throw new HTTPException(401, { message: "Unauthorized" });
        }

        const workspace = await databases.updateRow<Workspace>({
            databaseId: DATABASES_ID,
            tableId: WORKSPACES_ID,
            rowId: workspaceId,
            data: {
                inviteCode: generateInviteCode(6),
            },
        });

        return c.json({ data: workspace });
    })
    .post(
        "/:workspaceId/join",
        sessionMiddleware,
        zodValidator(
            "json",
            z.object({
                code: z.string(),
            }),
        ),
        async (c) => {
            const { workspaceId } = c.req.param();
            const { code } = c.req.valid("json");

            const databases = c.get("databases");
            const user = c.get("user");
            const { messaging } = await createAdminClient();

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (member) {
                throw new HTTPException(409, { message: "Already a member" });
            }

            const workspace = await databases.getRow<Workspace>({
                databaseId: DATABASES_ID,
                tableId: WORKSPACES_ID,
                rowId: workspaceId,
            });

            if (workspace.inviteCode !== code) {
                throw new HTTPException(400, {
                    message: "Invalid invite code",
                });
            }

            const targetId = await ensureEmailTarget({
                databases,
                userId: user.$id,
            });

            if (!targetId) {
                throw new HTTPException(400, {
                    message: "Failed to get target ID",
                });
            }

            const subscriber = await messaging.createSubscriber({
                topicId: `workspace_${workspaceId}`,
                subscriberId: ID.unique(),
                targetId,
            });

            if (!subscriber) {
                throw new HTTPException(400, {
                    message: "Failed to create subscriber",
                });
            }

            await databases.createRow({
                databaseId: DATABASES_ID,
                tableId: MEMBERS_ID,
                rowId: ID.unique(),
                data: {
                    workspaceId,
                    userId: user.$id,
                    role: MemberRole.MEMBER,
                    subscriberId: subscriber.$id,
                },
            });

            // publish message
            const channel = ably.channels.get(
                `notification:workspace:${workspaceId}`,
            );
            await channel.publish("member-join-workspace", {
                userId: user.$id,
                workspaceId,
                message: `Members with email ${user.email} joined workspace`,
                timestamp: new Date().toISOString(),
            });

            return c.json({ data: workspace });
        },
    )
    .get("/:workspaceId/analytics", sessionMiddleware, async (c) => {
        const databases = c.get("databases");
        const user = c.get("user");

        const { workspaceId } = c.req.param();

        const member = await getMember({
            databases,
            workspaceId,
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

        const thisMonthTasks = await databases.listRows<Task>({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("workspaceId", workspaceId),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        });

        const lastMonthTasks = await databases.listRows<Task>({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("workspaceId", workspaceId),
                Query.greaterThanEqual(
                    "$createdAt",
                    lastMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
            ],
        });

        const taskCount = thisMonthTasks.total;
        const taskDifference = taskCount - lastMonthTasks.total;

        const thisMonthAssignedTasks = await databases.listRows<Task>({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("workspaceId", workspaceId),
                Query.equal("assigneeId", member.$id),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        });

        const lastMonthAssignedTasks = await databases.listRows<Task>({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("workspaceId", workspaceId),
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

        const thisMonthIncompleteTasks = await databases.listRows<Task>({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("workspaceId", workspaceId),
                Query.notEqual("status", TaskStatus.DONE),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        });

        const lastMonthIncompleteTasks = await databases.listRows<Task>({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("workspaceId", workspaceId),
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

        const thisMonthCompletedTasks = await databases.listRows<Task>({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("workspaceId", workspaceId),
                Query.equal("status", TaskStatus.DONE),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        });

        const lastMonthCompletedTasks = await databases.listRows<Task>({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("workspaceId", workspaceId),
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

        const thisMonthOverdueTasks = await databases.listRows<Task>({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("workspaceId", workspaceId),
                Query.notEqual("status", TaskStatus.DONE),
                Query.lessThan("dueDate", now.toISOString()),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        });

        const lastMonthOverdueTasks = await databases.listRows<Task>({
            databaseId: DATABASES_ID,
            tableId: TASKS_ID,
            queries: [
                Query.equal("workspaceId", workspaceId),
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
