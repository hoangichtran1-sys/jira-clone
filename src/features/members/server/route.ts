import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { tasks } from "@trigger.dev/sdk";
import { createAdminClient } from "@/lib/appwrite";
import { sessionMiddleware } from "@/lib/session-middleware";
import { getMember } from "../utils";
import { DATABASES_ID, MEMBERS_ID, WORKSPACES_ID } from "@/config/appwrite";
import { Query } from "node-appwrite";
import { Member, MemberRole } from "../types";
import { ably } from "@/lib/ably-rest";
import type { sendEmailDeleteMember } from "@/trigger/send-mail-tasks";
import { Workspace } from "@/features/workspaces/types";
import { zodValidator } from "@/lib/zod-validator";

const app = new Hono()
    .get(
        "/current-member",
        zodValidator("query", z.object({ workspaceId: z.string() })),
        sessionMiddleware,
        async (c) => {
            const { workspaceId } = c.req.valid("query");
            const databases = c.get("databases");
            const user = c.get("user");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                throw new HTTPException(401, { message: "Unauthorized" });
            }

            return c.json({ data: member }, 200);
        },
    )
    .get(
        "/",
        sessionMiddleware,
        zodValidator("query", z.object({ workspaceId: z.string() })),
        async (c) => {
            const { users } = await createAdminClient();
            const databases = c.get("databases");
            const user = c.get("user");
            const { workspaceId } = c.req.valid("query");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                throw new HTTPException(401, { message: "Unauthorized" });
            }

            const members = await databases.listRows<Member>({
                databaseId: DATABASES_ID,
                tableId: MEMBERS_ID,
                queries: [Query.equal("workspaceId", workspaceId)],
            });

            const populatedMembers = await Promise.all(
                members.rows.map(async (member) => {
                    const user = await users.get({ userId: member.userId });

                    return {
                        ...member,
                        role: member.role,
                        name: user.name,
                        email: user.email,
                    };
                }),
            );

            return c.json({
                data: {
                    ...members,
                    documents: populatedMembers,
                },
            });
        },
    )
    .delete(
        "/:memberId",
        zodValidator("query", z.object({ workspaceId: z.string() })),
        sessionMiddleware,
        async (c) => {
            const { memberId } = c.req.param();
            const { workspaceId } = c.req.valid("query");

            const user = c.get("user");
            const databases = c.get("databases");
            const { messaging, users } = await createAdminClient();

            const memberToDelete = await databases.getRow<Member>({
                databaseId: DATABASES_ID,
                tableId: MEMBERS_ID,
                rowId: memberId,
            });

            const workspace = await databases.getRow<Workspace>({
                databaseId: DATABASES_ID,
                tableId: WORKSPACES_ID,
                rowId: workspaceId,
            });

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                throw new HTTPException(401, { message: "Unauthorized" });
            }

            if (member.workspaceId !== memberToDelete.workspaceId) {
                throw new HTTPException(403, {
                    message: "Cannot delete member in other workspace",
                });
            }

            const isSelf = member.$id === memberToDelete.$id;
            const isAdmin = member.role === MemberRole.ADMIN;
            const isOwnerDelete = workspace.userId === memberToDelete.userId;
            const isOwnerWorkspace = workspace.userId === member.userId;
            const populatedMemberEmail = (
                await users.get({ userId: memberToDelete.userId })
            ).email;

            if (isOwnerDelete) {
                throw new HTTPException(400, {
                    message: "Cannot delete the owner workspace",
                });
            }

            if (!isAdmin) {
                throw new HTTPException(403, { message: "Forbidden" });
            }

            if (
                memberToDelete.role === MemberRole.ADMIN &&
                !isSelf &&
                !isOwnerWorkspace
            ) {
                throw new HTTPException(400, {
                    message: "Cannot delete another admin",
                });
            }

            await databases.deleteRow({
                databaseId: DATABASES_ID,
                tableId: MEMBERS_ID,
                rowId: memberId,
            });

            // unsubscribe
            messaging.deleteSubscriber({
                topicId: `workspace_${memberToDelete.workspaceId}`,
                subscriberId: memberToDelete.subscriberId,
            });

            // publish message
            const channel = ably.channels.get(
                `notification:workspace:${memberToDelete.workspaceId}`,
            );

            await channel.publish("remove-member", {
                userId: user.$id,
                workspaceId: memberToDelete.workspaceId,
                memberIdToDelete: memberToDelete.userId,
                message: `The member with email ${populatedMemberEmail} has left the workspace.`,
                timestamp: new Date().toISOString(),
            });

            const handle = await tasks.trigger<typeof sendEmailDeleteMember>(
                "send-email-delete-member",
                {
                    from: `"Workspace admin" <${user.email}>`,
                    email: populatedMemberEmail,
                    subject: `Member deleted from workspace "${memberToDelete.workspaceId}"`,
                    html: `
                <p>You have been removed from the workspace group by the administrator.</p><br>
                <p>Contact them for more details.</p>
            `,
                },
            );

            console.log(handle);

            return c.json({ data: { $id: memberToDelete.$id } });
        },
    )
    .patch(
        "/:memberId",
        sessionMiddleware,
        zodValidator("query", z.object({ workspaceId: z.string() })),
        zodValidator("json", z.object({ role: z.nativeEnum(MemberRole) })),
        async (c) => {
            const { memberId } = c.req.param();
            const { role } = c.req.valid("json");
            const { workspaceId } = c.req.valid("query");
            const user = c.get("user");
            const databases = c.get("databases");

            const memberToUpdate = await databases.getRow<Member>({
                databaseId: DATABASES_ID,
                tableId: MEMBERS_ID,
                rowId: memberId,
            });

            const workspace = await databases.getRow<Workspace>({
                databaseId: DATABASES_ID,
                tableId: WORKSPACES_ID,
                rowId: workspaceId,
            });

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                throw new HTTPException(401, { message: "Unauthorized" });
            }

            if (member.workspaceId !== memberToUpdate.workspaceId) {
                throw new HTTPException(403, {
                    message: "Cannot updata member in other workspace",
                });
            }

            const isAdmin = member.role === MemberRole.ADMIN;
            const isSelf = member.$id === memberToUpdate.$id;
            const isOwnerUpdate = workspace.userId === memberToUpdate.userId;
            const isOwnerWorkspace = workspace.userId === member.userId;

            if (isOwnerUpdate) {
                throw new HTTPException(400, {
                    message: "Cannot update the owner workspace",
                });
            }

            if (!isAdmin) {
                throw new HTTPException(403, { message: "Forbidden" });
            }

            if (isSelf && role === member.role) {
                throw new HTTPException(409, {
                    message: "Cannot update your own role is conflict",
                });
            }

            if (
                memberToUpdate.role === MemberRole.ADMIN &&
                !isSelf &&
                !isOwnerWorkspace
            ) {
                throw new HTTPException(400, {
                    message: "Cannot update another admin",
                });
            }

            await databases.updateRow<Member>({
                databaseId: DATABASES_ID,
                tableId: MEMBERS_ID,
                rowId: memberId,
                data: {
                    role,
                },
            });

            return c.json({ data: { $id: memberToUpdate.$id } });
        },
    );

export default app;
