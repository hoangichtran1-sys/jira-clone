import { COOKIE_MAX_AGE } from "@/constants";
import { env } from "@/lib/env";
import { createAppwriteHandlers } from "@appwrite.io/react/handlers/next";

export const { GET, POST } = createAppwriteHandlers({
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
    apiKey: env.APPWRITE_API_KEY,
    basePath: "/api/appwrite",
    cookieOptions: {
        maxAge: COOKIE_MAX_AGE,
    },
});
