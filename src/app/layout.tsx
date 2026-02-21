import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/provider/query-provider";
import { NuqsAdapter } from "nuqs/adapters/next";
import { JotaiProvider } from "@/provider/jotai-provider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Jira clone",
    description: "Jira clone",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <NuqsAdapter>
            <html lang="en">
                <body
                    className={cn(inter.className, "antialiased min-h-screen")}
                >
                    <QueryProvider>
                        <JotaiProvider>
                            <Toaster />
                            {children}
                        </JotaiProvider>
                    </QueryProvider>
                </body>
            </html>
        </NuqsAdapter>
    );
}
