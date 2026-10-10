import { sessionMiddleware } from "@/lib/session-middleware";
import { Hono } from "hono";
import { ably } from "@/lib/ably-rest";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { getMember } from "@/features/members/utils";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASES_ID, MEMBERS_ID } from "@/config/appwrite";
import { Member, PresenceEvent } from "@/features/members/types";
import { env } from "@/lib/env";
import { zodValidator } from "@/lib/zod-validator";

const app = new Hono()
    .get("/auth", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const tokenRequestData = await ably.auth.createTokenRequest({
            clientId: `jira-client.${user.$id}`,
            ttl: 3600000 * 24,
            capability: {
                [`user-notification:${user.$id}`]: ["subscribe"],
            },
        });

        return c.json({ data: tokenRequestData });
    })
    .get(
        "/workspace",
        zodValidator(
            "query",
            z.object({
                workspaceId: z.string(),
            }),
        ),
        sessionMiddleware,
        async (c) => {
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

            const tokenRequestData = await ably.auth.createTokenRequest({
                clientId: `jira-client.${user.$id}`,
                ttl: 3600000 * 24,
                capability: {
                    [`notification:workspace:${workspaceId}`]: [
                        "subscribe",
                        "presence",
                    ],
                    [`sms:workspace:${workspaceId}`]: ["subscribe", "publish"],
                },
            });

            return c.json({ data: tokenRequestData });
        },
    )
    .post("/webhook", async (c) => {
        const secret = c.req.header("x-webhook-secret");

        if (!secret || secret !== env.ABLY_WEBHOOK_SECRET) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        const body = await c.req.json();
        const channelName = body.channel;
        const workspaceId = channelName.split(":").pop();

        if (!workspaceId) return c.json({ error: "Invalid channel" }, 400);

        const { databases } = await createAdminClient();

        for (const presence of body.presence) {
            if (presence.action === PresenceEvent.LEAVE) {
                const clientId = presence.clientId; // jira-client.user_123
                const userId = clientId.replace("jira-client.", "");

                const member = await getMember({
                    databases,
                    userId,
                    workspaceId,
                });

                if (!member) {
                    return c.json({ error: "Unauthorized" }, 401);
                }

                await databases.updateRow<Member>({
                    databaseId: DATABASES_ID,
                    tableId: MEMBERS_ID,
                    rowId: member.$id,
                    data: {
                        lastSeen: new Date().toISOString(),
                    },
                });
            } else {
                return c.json({ error: "No support event action" }, 406);
            }
        }

        return c.json({ ok: true });
    });
export default app;
