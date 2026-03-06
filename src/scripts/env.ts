import { bootstrap } from "./bootstrap";

bootstrap();

export function getAppwriteEnv() {
    return {
        DATABASES_ID: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,

        WORKSPACES_ID: process.env.NEXT_PUBLIC_APPWRITE_WORKSPACES_ID!,

        MEMBERS_ID: process.env.NEXT_PUBLIC_APPWRITE_MEMBERS_ID!,

        PROJECTS_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_ID!,

        TASKS_ID: process.env.NEXT_PUBLIC_APPWRITE_TASKS_ID!,

        SUBSCRIPTION_ID: process.env.NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_ID!,

        USER_TARGET_EMAIL_ID:
            process.env.NEXT_PUBLIC_APPWRITE_USER_TARGET_EMAIL_ID!,

        IMAGES_BUCKET_ID: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID!,
    };
}
