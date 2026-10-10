"use client";

import dynamic from "next/dynamic";
import { AblyChannelClientProvider } from "@/provider/ably-channel-provider";
import { NotificationProvider } from "@/provider/notification-provider";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

const AblyWorkspaceClientProvider = dynamic(
    () =>
        import("@/provider/ably-provider").then(
            (mod) => mod.AblyWorkspaceClientProvider,
        ),
    { ssr: false },
);

interface LayoutProps {
    children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    const workspaceId = useWorkspaceId();

    return (
        <AblyWorkspaceClientProvider workspaceId={workspaceId}>
            <AblyChannelClientProvider
                channelName={`notification:workspace:${workspaceId}`}
            >
                <AblyChannelClientProvider
                    channelName={`sms:workspace:${workspaceId}`}
                >
                    <NotificationProvider workspaceId={workspaceId} />
                    {children}
                </AblyChannelClientProvider>
            </AblyChannelClientProvider>
        </AblyWorkspaceClientProvider>
    );
};

export default Layout;
