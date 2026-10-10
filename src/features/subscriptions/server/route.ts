import { z } from "zod";
import { setupLemon } from "@/lib/ls";
import { HTTPException } from "hono/http-exception";
import { getSubscription, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { Hono } from "hono";
import crypto from "crypto";
import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASES_ID, SUBSCRIPTION_ID } from "@/config/appwrite";
import { ID } from "node-appwrite";
import { Subscription } from "../types";
import { createAdminClient } from "@/lib/appwrite";
import { getCurrentSubscription } from "../utils";
import { env } from "@/lib/env";
import { zodValidator } from "@/lib/zod-validator";

setupLemon();

const app = new Hono()
    .get("/current-subscription", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");

        const subscription = await getCurrentSubscription({
            databases,
            userId: user.$id,
        });

        return c.json({ data: subscription });
    })
    .post(
        "/checkout",
        zodValidator("query", z.object({ origin: z.string() })),
        sessionMiddleware,
        async (c) => {
            const { origin } = c.req.valid("query");
            const user = c.get("user");
            const databases = c.get("databases");

            const existingSubscription = await getCurrentSubscription({
                databases,
                userId: user.$id,
            });

            if (existingSubscription) {
                const subscription = await getSubscription(
                    existingSubscription.subscriptionId,
                );

                const portalUrl =
                    subscription.data?.data.attributes.urls.customer_portal;

                if (!portalUrl) {
                    throw new HTTPException(500, {
                        message: "Internal server error",
                    });
                }
                return c.json({ data: portalUrl });
            }
            console.log(env.LEMONSQUEEZY_STORE_ID);
            console.log(env.LEMONSQUEEZY_PRODUCT_ID);
            const checkout = await createCheckout(
                env.LEMONSQUEEZY_STORE_ID,
                env.LEMONSQUEEZY_PRODUCT_ID,
                {
                    checkoutData: {
                        custom: {
                            user_id: user.$id,
                        },
                    },
                    productOptions: {
                        redirectUrl: `${env.APP_URL}${origin}?success=true`,
                    },
                },
            );
            console.log(
                "Full checkout response:",
                JSON.stringify(checkout, null, 2),
            );
            const checkoutUrl = checkout.data?.data.attributes.url;

            if (!checkoutUrl) {
                throw new HTTPException(500, {
                    message: "Internal server error",
                });
            }

            return c.json({ data: checkoutUrl });
        },
    )
    .post("/webhook", async (c) => {
        const text = await c.req.text();

        const hmac = crypto.createHmac(
            "sha256",
            env.LEMONSQUEEZY_WEBHOOK_SECRET,
        );
        const digest = Buffer.from(hmac.update(text).digest("hex"), "utf8");

        const signature = Buffer.from(
            c.req.header("x-signature") as string,
            "utf8",
        );

        if (!crypto.timingSafeEqual(digest, signature)) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const payload = JSON.parse(text);
        const event = payload.meta.event_name;

        const subscriptionId = payload.data.id;
        const userId = payload.meta.custom_data.user_id;
        const status = payload.data.attributes.status;

        const { databases } = await createAdminClient();

        const existingSubscription = await getCurrentSubscription({
            databases,
            userId,
        });

        const supportedEvents = [
            "subscription_created",
            "subscription_updated",
            "subscription_cancelled",
            "subscription_expired",
        ];

        if (supportedEvents.includes(event)) {
            if (existingSubscription) {
                await databases.updateRow<Subscription>({
                    databaseId: DATABASES_ID,
                    tableId: SUBSCRIPTION_ID,
                    rowId: existingSubscription.$id,
                    data: {
                        status,
                    },
                });
            } else {
                await databases.createRow<Subscription>({
                    databaseId: DATABASES_ID,
                    tableId: SUBSCRIPTION_ID,
                    rowId: ID.unique(),
                    data: {
                        userId,
                        subscriptionId,
                        status,
                    },
                });
            }

            return c.json({ success: true }, 200);
        }

        return c.json({ error: "Event no supported" }, 400);
    });

export default app;
