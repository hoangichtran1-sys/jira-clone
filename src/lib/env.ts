import { z } from "zod";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
    server: {
        NODE_ENV: z
            .union([z.literal("development"), z.literal("production")])
            .default("development"),
        APP_URL: z.string().min(1),
        ADMIN_EMAIL: z.string().email(),

        ABLY_API_KEY: z.string().min(1),
        ABLY_WEBHOOK_SECRET: z.string().min(1),

        APPWRITE_DATABASE_ID: z.string().min(1),
        APPWRITE_WORKSPACES_ID: z.string().min(1),
        APPWRITE_MEMBERS_ID: z.string().min(1),
        APPWRITE_PROJECTS_ID: z.string().min(1),
        APPWRITE_TASKS_ID: z.string().min(1),
        APPWRITE_SUBSCRIPTIONS_ID: z.string().min(1),
        APPWRITE_USER_TARGET_EMAIL_ID: z.string().min(1),
        APPWRITE_STORAGE_ID: z.string().min(1),
        APPWRITE_API_KEY: z.string().min(1),

        LEMONSQUEEZY_STORE_ID: z.union([
            z.coerce.number().int().positive(),
            z.string().min(1),
        ]),
        LEMONSQUEEZY_PRODUCT_ID: z.union([
            z.coerce.number().int().positive(),
            z.string().min(1),
        ]),
        LEMONSQUEEZY_API_KEY: z.string().min(1),
        LEMONSQUEEZY_WEBHOOK_SECRET: z.string().min(1),

        MAIL_MAILER: z.string().min(1),
        MAIL_HOST: z.string().min(1),
        MAIL_PORT: z.coerce.number().int().positive(),
        MAIL_ENCRYPTION: z.string().min(1),
        MAIL_SECURE: z.coerce.boolean().default(false),
        MAIL_USERNAME: z.string().email(),
        MAIL_PASSWORD: z.string().min(1),
        EMAIL_FROM: z.string().email(),

        ARCJET_ENV: z
            .union([z.literal("development"), z.literal("production")])
            .default("development"),
        ARCJET_KEY: z.string().min(1),
        ARCJECT_MODE: z
            .union([z.literal("DRY_RUN"), z.literal("LIVE")])
            .default("LIVE"),

        REDIS_URL: z.string().min(1),

        TRIGGER_SECRET_KEY: z.string().min(1),
    },
    experimental__runtimeEnv: {},
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
