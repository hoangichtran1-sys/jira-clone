import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/provider/query-provider";
import { NuqsAdapter } from "nuqs/adapters/next";
import { JotaiProvider } from "@/provider/jotai-provider";
import { ModalProvider } from "@/provider/modal-provider";
import { AppwriteProviders } from "@/provider/appwrite-provider";
import { appwrite } from "@/lib/appwrite-client";
import { ConfettiProvider } from "@/provider/confetti-provider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Jira clone",
    description: "Jira clone",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const helpers = createNextServerHelpers(appwrite);
    const session = await helpers.readSessionCookie();

    return (
        <NuqsAdapter>
            <html lang="en">
                <body
                    className={cn(inter.className, "antialiased min-h-screen")}
                >
                    <AppwriteProviders session={session}>
                        <QueryProvider>
                            <JotaiProvider>
                                <ModalProvider />
                                <ConfettiProvider />
                                <Toaster />
                                {children}
                            </JotaiProvider>
                        </QueryProvider>
                    </AppwriteProviders>
                </body>
            </html>
        </NuqsAdapter>
    );
}
