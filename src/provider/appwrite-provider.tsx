"use client";

import { AppwriteProvider } from "@appwrite.io/react";

export function AppwriteProviders({
    session,
    children,
}: {
    session?: string | null;
    children: React.ReactNode;
}) {
    return (
        <AppwriteProvider
            endpoint={process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!}
            projectId={process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!}
            ssr={{ session, basePath: "/api/appwrite" }}
        >
            {children}
        </AppwriteProvider>
    );
}
