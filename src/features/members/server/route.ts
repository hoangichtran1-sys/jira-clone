import { createAdminClient } from "@/lib/appwrite";
import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { getMember } from "../utils";
import { DATABASES_ID, MEMBERS_ID } from "@/config/appwrite";
import { Query } from "node-appwrite";
import { Member, MemberRole } from "../types";

const app = new Hono()
    .get(
        "/",
        sessionMiddleware,
        zValidator("query", z.object({ workspaceId: z.string() })),
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
                return c.json({ error: "Unauthorized" }, 401);
            }

            const members = await databases.listDocuments<Member>(
                DATABASES_ID,
                MEMBERS_ID,
                [Query.equal("workspaceId", workspaceId)],
            );

            const populatedMembers = await Promise.all(
                members.documents.map(async (member) => {
                    const user = await users.get(member.userId);

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
    .delete("/:memberId", sessionMiddleware, async (c) => {
        const { memberId } = c.req.param();
        const user = c.get("user");
        const databases = c.get("databases");

        const memberToDelete = await databases.getDocument(
            DATABASES_ID,
            MEMBERS_ID,
            memberId,
        );

        const allMembersInWorkspace = await databases.listDocuments(
            DATABASES_ID,
            MEMBERS_ID,
            [Query.equal("workspaceId", memberToDelete.workspaceId)],
        );

        const member = await getMember({
            databases,
            workspaceId: memberToDelete.workspaceId,
            userId: user.$id,
        });

        const isSelf = member.$id === memberToDelete.$id;
        const isAdmin = member.role === MemberRole.ADMIN;
        const isTargetAdmin = memberToDelete.role === MemberRole.ADMIN;

        const isLastAdmin =
            memberToDelete.role === MemberRole.ADMIN &&
            allMembersInWorkspace.documents.filter(
                (m) => m.role === MemberRole.ADMIN,
            ).length === 1;

        if (!member) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        if (member.workspaceId !== memberToDelete.workspaceId) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        if (allMembersInWorkspace.total === 1) {
            return c.json({ error: "Cannot delete the only member" }, 400);
        }

        if (!isSelf && !isAdmin) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        if (isTargetAdmin && !isSelf) {
            return c.json({ error: "Cannot remove another admin" }, 400);
        }

        if (isLastAdmin) {
            return c.json({ error: "Cannot delete the last admin" }, 400);
        }

        await databases.deleteDocument(DATABASES_ID, MEMBERS_ID, memberId);

        return c.json({ data: { $id: memberToDelete.$id } });
    })
    .patch(
        "/:memberId",
        sessionMiddleware,
        zValidator("json", z.object({ role: z.nativeEnum(MemberRole) })),
        async (c) => {
            const { memberId } = c.req.param();
            const { role } = c.req.valid("json");
            const user = c.get("user");
            const databases = c.get("databases");

            const memberToUpdate = await databases.getDocument(
                DATABASES_ID,
                MEMBERS_ID,
                memberId,
            );

            const allMembersInWorkspace = await databases.listDocuments(
                DATABASES_ID,
                MEMBERS_ID,
                [Query.equal("workspaceId", memberToUpdate.workspaceId)],
            );

            const member = await getMember({
                databases,
                workspaceId: memberToUpdate.workspaceId,
                userId: user.$id,
            });

            const isAdmin = member.role === MemberRole.ADMIN;
            const isSelf = member.$id === memberToUpdate.$id;

            const isLastAdmin =
                memberToUpdate.role === MemberRole.ADMIN &&
                allMembersInWorkspace.documents.filter(
                    (m) => m.role === MemberRole.ADMIN,
                ).length === 1;

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            if (member.workspaceId !== memberToUpdate.workspaceId) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            if (allMembersInWorkspace.total === 1) {
                return c.json(
                    { error: "Cannot downgrade the only member" },
                    400,
                );
            }

            if (!isAdmin) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            if (isSelf && role === member.role) {
                return c.json(
                    { error: "Cannot update your own role is conflict" },
                    409,
                );
            }

            if (memberToUpdate.role === MemberRole.ADMIN && !isSelf) {
                return c.json({ error: "Cannot update another admin" }, 400);
            }

            if (isLastAdmin) {
                return c.json(
                    { error: "Cannot downgrade the last admin" },
                    400,
                );
            }

            await databases.updateDocument(DATABASES_ID, MEMBERS_ID, memberId, {
                role,
            });

            return c.json({ data: { $id: memberToUpdate.$id } });
        },
    );

export default app;
