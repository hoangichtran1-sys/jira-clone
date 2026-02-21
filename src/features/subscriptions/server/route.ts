import { setupLemon } from "@/lib/ls";
import { getSubscription, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { Hono } from "hono";
import crypto from "crypto";
import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASES_ID, SUBSCRIPTION_ID } from "@/config/appwrite";
import { AppwriteException, ID } from "node-appwrite";
import { Subscription } from "../types";
import { createAdminClient } from "@/lib/appwrite";
import { toHttpStatus } from "@/lib/utils";
import { getCurrentSubscription } from "../utils";

setupLemon();

const app = new Hono()
    .get("/current-subscription", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        try {
            const subscription = await getCurrentSubscription({
                databases,
                userId: user.$id,
            });

            return c.json({ data: subscription });
        } catch (error) {
            if (
                error instanceof AppwriteException &&
                toHttpStatus(error.code) === 404
            ) {
                return c.json({ data: null });
            }

            return c.json({ error: "Internal Server Error" }, 500);
        }
    })
    .post("/checkout", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");

        let existingSubscription: Subscription | null = null;

        try {
            existingSubscription = await getCurrentSubscription({
                databases,
                userId: user.$id,
            });
        } catch (error) {
            if (
                error instanceof AppwriteException &&
                toHttpStatus(error.code) === 404
            ) {
                existingSubscription = null;
            } else {
                return c.json({ error: "Internal Server Error" }, 500);
            }
        }
        if (existingSubscription) {
            const subscription = await getSubscription(
                existingSubscription.subscriptionId,
            );

            const portalUrl =
                subscription.data?.data.attributes.urls.customer_portal;

            if (!portalUrl) {
                return c.json({ error: "Internal error" }, 500);
            }
            return c.json({ data: portalUrl });
        }

        const checkout = await createCheckout(
            process.env.LEMONSQUEEZY_STORE_ID!,
            process.env.LEMONSQUEEZY_PRODUCT_ID!,
            {
                checkoutData: {
                    custom: {
                        user_id: user.$id,
                    },
                },
                productOptions: {
                    redirectUrl: `${process.env.NEXT_PUBLIC_API_URL!}/checkout/success`,
                },
            },
        );

        const checkoutUrl = checkout.data?.data.attributes.url;

        if (!checkoutUrl) {
            return c.json({ error: "Internal Server Error" }, 500);
        }

        return c.json({ data: checkoutUrl });
    })
    .post("/webhook", async (c) => {
        const text = await c.req.text();

        const hmac = crypto.createHmac(
            "sha256",
            process.env.LEMONSQUEEZY_WEBHOOK_SECRET!,
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

        let existingSubscription: Subscription | null = null;

        try {
            existingSubscription = await getCurrentSubscription({
                databases,
                userId,
            });
        } catch (error) {
            if (
                error instanceof AppwriteException &&
                toHttpStatus(error.code) === 404
            ) {
                existingSubscription = null;
            } else if (error instanceof AppwriteException) {
                return c.json(
                    {
                        error: error.message,
                        type: error.type,
                    },
                    toHttpStatus(error.code),
                );
            } else {
                return c.json({ error: "Internal Server Error" }, 500);
            }
        }

        if (event === "subscription_created") {
            if (existingSubscription) {
                await databases.updateDocument(
                    DATABASES_ID,
                    SUBSCRIPTION_ID,
                    existingSubscription.$id,
                    {
                        status,
                    },
                );
            }
            await databases.createDocument(
                DATABASES_ID,
                SUBSCRIPTION_ID,
                ID.unique(),
                {
                    userId,
                    subscriptionId,
                    status,
                },
            );
        } else if (event === "subscription_updated") {
            if (existingSubscription) {
                await databases.updateDocument(
                    DATABASES_ID,
                    SUBSCRIPTION_ID,
                    existingSubscription.$id,
                    {
                        status,
                    },
                );
            }
            return c.json({ error: "Internal Server Error" }, 500);
        } else {
            return c.json({ error: "Action no support" }, 404);
        }

        return c.json({}, 200);
    });

export default app;
