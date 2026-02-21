import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { Hono } from "hono";
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
import { MemberRole } from "@/features/members/types";
import { generateInviteCode } from "@/lib/utils";
import { getMember } from "@/features/members/utils";
import { Workspace } from "../types";
import { TaskStatus } from "@/features/tasks/types";
import { getCurrentWorkspacesIsAdmin } from "../utils";
import { MAX_FREE_WORKSPACE } from "@/constants";
import { getCurrentSubscription } from "@/features/subscriptions/utils";
import { render } from "@react-email/render";
import { InviteEmail } from "../emails/invite-email";
import { transporter } from "@/lib/nodemailer";

const app = new Hono()
    .post(
        "/send-email-invitation",
        zValidator(
            "query",
            z.object({
                workspaceId: z.string(),
            }),
        ),
        zValidator(
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

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const currentSubscription = await getCurrentSubscription({
                databases,
                userId: user.$id,
            });

            if (!currentSubscription) {
                return c.json(
                    { error: "You need to upgrade your account to premium" },
                    403,
                );
            }

            const html = await render(
                <InviteEmail
                    title={title}
                    link={link}
                    sentTime={new Date().toLocaleString()}
                />,
            );

            const info = await transporter.sendMail({
                from: `"Workspace member" <${user.email}>`,
                to: emailTo,
                subject: title,
                html,
            });

            return c.json({ data: info.messageId });
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

        const members = await databases.listDocuments(
            DATABASES_ID,
            MEMBERS_ID,
            [Query.equal("userId", user.$id)],
        );

        if (members.total === 0) {
            return c.json({ data: { documents: [], total: 0 } });
        }

        const workspaceIds = members.documents.map(
            (member) => member.workspaceId,
        );

        const workspaces = await databases.listDocuments<Workspace>(
            DATABASES_ID,
            WORKSPACES_ID,
            [
                Query.orderDesc("$createdAt"),
                Query.contains("$id", workspaceIds),
            ],
        );

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
            return c.json({ error: "Unauthorized" }, 401);
        }

        const workspace = await databases.getDocument<Workspace>(
            DATABASES_ID,
            WORKSPACES_ID,
            workspaceId,
        );

        return c.json({ data: workspace });
    })
    .get("/:workspaceId/info", sessionMiddleware, async (c) => {
        const databases = c.get("databases");
        const { workspaceId } = c.req.param();

        const workspaceInfo = await databases.getDocument<Workspace>(
            DATABASES_ID,
            WORKSPACES_ID,
            workspaceId,
        );

        return c.json({
            data: {
                name: workspaceInfo.name,
                imageUrl: workspaceInfo.imageUrl,
            },
        });
    })
    .post(
        "/",
        sessionMiddleware,
        zValidator("form", createWorkspaceSchema),
        async (c) => {
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");

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
                return c.json(
                    {
                        error: "You have reached the maximum number of free workspaces",
                    },
                    403,
                );
            }

            let uploadedImageUrl: string | undefined;

            if (image instanceof File) {
                const file = await storage.createFile(
                    IMAGES_BUCKET_ID,
                    ID.unique(),
                    image,
                );

                const arrayBuffer = await storage.getFileView(
                    IMAGES_BUCKET_ID,
                    file.$id,
                );

                uploadedImageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString("base64")}`;
            }

            const workspace = await databases.createDocument<Workspace>(
                DATABASES_ID,
                WORKSPACES_ID,
                ID.unique(),
                {
                    name,
                    userId: user.$id,
                    imageUrl: uploadedImageUrl,
                    inviteCode: generateInviteCode(6),
                },
            );

            await databases.createDocument(
                DATABASES_ID,
                MEMBERS_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    workspaceId: workspace.$id,
                    role: MemberRole.ADMIN,
                },
            );

            return c.json({ data: workspace });
        },
    )
    .patch(
        "/:workspaceId",
        sessionMiddleware,
        zValidator("form", updateWorkspaceSchema),
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
                return c.json({ error: "Unauthorized" }, 401);
            }

            let uploadedImageUrl: string | undefined;

            if (image instanceof File) {
                const file = await storage.createFile(
                    IMAGES_BUCKET_ID,
                    ID.unique(),
                    image,
                );

                const arrayBuffer = await storage.getFileView(
                    IMAGES_BUCKET_ID,
                    file.$id,
                );

                uploadedImageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString("base64")}`;
            } else {
                uploadedImageUrl = image;
            }

            const workspace = await databases.updateDocument(
                DATABASES_ID,
                WORKSPACES_ID,
                workspaceId,
                {
                    name,
                    imageUrl: uploadedImageUrl,
                },
            );

            return c.json({ data: workspace });
        },
    )
    .delete("/:workspaceId", sessionMiddleware, async (c) => {
        const databases = c.get("databases");
        const user = c.get("user");

        const { workspaceId } = c.req.param();

        const member = await getMember({
            databases,
            workspaceId,
            userId: user.$id,
        });

        if (!member || member.role !== MemberRole.ADMIN) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        // DELETE members, projects and tasks
        const membersToDelete = await databases.listDocuments(
            DATABASES_ID,
            MEMBERS_ID,
            [Query.equal("workspaceId", workspaceId)],
        );
        const projectsToDelete = await databases.listDocuments(
            DATABASES_ID,
            PROJECTS_ID,
            [Query.equal("workspaceId", workspaceId)],
        );
        const tasksToDelete = await databases.listDocuments(
            DATABASES_ID,
            TASKS_ID,
            [Query.equal("workspaceId", workspaceId)],
        );

        if (membersToDelete.total > 0) {
            await Promise.all(
                membersToDelete.documents.map(async (member) => {
                    await databases.deleteDocument(
                        DATABASES_ID,
                        MEMBERS_ID,
                        member.$id,
                    );
                }),
            );
        }

        if (projectsToDelete.total > 0) {
            await Promise.all(
                projectsToDelete.documents.map(async (project) => {
                    await databases.deleteDocument(
                        DATABASES_ID,
                        PROJECTS_ID,
                        project.$id,
                    );
                }),
            );
        }

        if (tasksToDelete.total > 0) {
            await Promise.all(
                tasksToDelete.documents.map(async (task) => {
                    await databases.deleteDocument(
                        DATABASES_ID,
                        TASKS_ID,
                        task.$id,
                    );
                }),
            );
        }

        await databases.deleteDocument(
            DATABASES_ID,
            WORKSPACES_ID,
            workspaceId,
        );

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
            return c.json({ error: "Unauthorized" }, 401);
        }

        const workspace = await databases.updateDocument(
            DATABASES_ID,
            WORKSPACES_ID,
            workspaceId,
            {
                inviteCode: generateInviteCode(6),
            },
        );

        return c.json({ data: workspace });
    })
    .post(
        "/:workspaceId/join",
        sessionMiddleware,
        zValidator(
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

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (member) {
                return c.json({ error: "Already a member" }, 400);
            }

            const workspace = await databases.getDocument<Workspace>(
                DATABASES_ID,
                WORKSPACES_ID,
                workspaceId,
            );

            if (workspace.inviteCode !== code) {
                return c.json({ error: "Invalid invite code " }, 400);
            }

            await databases.createDocument(
                DATABASES_ID,
                MEMBERS_ID,
                ID.unique(),
                {
                    workspaceId,
                    userId: user.$id,
                    role: MemberRole.MEMBER,
                },
            );

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
            return c.json({ error: "Unauthorized" }, 401);
        }

        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const thisMonthEnd = endOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        // const thisMonthProjects = await databases.listDocuments(
        //     DATABASES_ID,
        //     PROJECTS_ID,
        //     [
        //         Query.equal("workspaceId", workspaceId),
        //         Query.greaterThanEqual(
        //             "$createdAt",
        //             thisMonthStart.toISOString(),
        //         ),
        //         Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
        //     ],
        // );

        // const lastMonthProjects = await databases.listDocuments(
        //     DATABASES_ID,
        //     PROJECTS_ID,
        //     [
        //         Query.equal("workspaceId", workspaceId),
        //         Query.greaterThanEqual(
        //             "$createdAt",
        //             lastMonthStart.toISOString(),
        //         ),
        //         Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
        //     ],
        // );

        // const projectCount = thisMonthProjects.total;
        // const projectDifference = projectCount - lastMonthProjects.total;

        const thisMonthTasks = await databases.listDocuments(
            DATABASES_ID,
            TASKS_ID,
            [
                Query.equal("workspaceId", workspaceId),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        );

        const lastMonthTasks = await databases.listDocuments(
            DATABASES_ID,
            TASKS_ID,
            [
                Query.equal("workspaceId", workspaceId),
                Query.greaterThanEqual(
                    "$createdAt",
                    lastMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
            ],
        );

        const taskCount = thisMonthTasks.total;
        const taskDifference = taskCount - lastMonthTasks.total;

        const thisMonthAssignedTasks = await databases.listDocuments(
            DATABASES_ID,
            TASKS_ID,
            [
                Query.equal("workspaceId", workspaceId),
                Query.equal("assigneeId", member.$id),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        );

        const lastMonthAssignedTasks = await databases.listDocuments(
            DATABASES_ID,
            TASKS_ID,
            [
                Query.equal("workspaceId", workspaceId),
                Query.equal("assigneeId", member.$id),
                Query.greaterThanEqual(
                    "$createdAt",
                    lastMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
            ],
        );

        const assignedTaskCount = thisMonthAssignedTasks.total;
        const assignedTaskDifference =
            assignedTaskCount - lastMonthAssignedTasks.total;

        const thisMonthIncompleteTasks = await databases.listDocuments(
            DATABASES_ID,
            TASKS_ID,
            [
                Query.equal("workspaceId", workspaceId),
                Query.notEqual("status", TaskStatus.DONE),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        );

        const lastMonthIncompleteTasks = await databases.listDocuments(
            DATABASES_ID,
            TASKS_ID,
            [
                Query.equal("workspaceId", workspaceId),
                Query.notEqual("status", TaskStatus.DONE),
                Query.greaterThanEqual(
                    "$createdAt",
                    lastMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
            ],
        );

        const incompleteTaskCount = thisMonthIncompleteTasks.total;
        const incompleteTaskDifference =
            incompleteTaskCount - lastMonthIncompleteTasks.total;

        const thisMonthCompletedTasks = await databases.listDocuments(
            DATABASES_ID,
            TASKS_ID,
            [
                Query.equal("workspaceId", workspaceId),
                Query.equal("status", TaskStatus.DONE),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        );

        const lastMonthCompletedTasks = await databases.listDocuments(
            DATABASES_ID,
            TASKS_ID,
            [
                Query.equal("workspaceId", workspaceId),
                Query.equal("status", TaskStatus.DONE),
                Query.greaterThanEqual(
                    "$createdAt",
                    lastMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
            ],
        );

        const completedTaskCount = thisMonthCompletedTasks.total;
        const completedTaskDifference =
            completedTaskCount - lastMonthCompletedTasks.total;

        const thisMonthOverdueTasks = await databases.listDocuments(
            DATABASES_ID,
            TASKS_ID,
            [
                Query.equal("workspaceId", workspaceId),
                Query.notEqual("status", TaskStatus.DONE),
                Query.lessThan("dueDate", now.toISOString()),
                Query.greaterThanEqual(
                    "$createdAt",
                    thisMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
            ],
        );

        const lastMonthOverdueTasks = await databases.listDocuments(
            DATABASES_ID,
            TASKS_ID,
            [
                Query.equal("workspaceId", workspaceId),
                Query.notEqual("status", TaskStatus.DONE),
                Query.lessThan("dueDate", now.toISOString()),
                Query.greaterThanEqual(
                    "$createdAt",
                    lastMonthStart.toISOString(),
                ),
                Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
            ],
        );

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
