import { AblyChannelClientProvider } from "@/provider/ably-channel-provider";
import { AblyWorkspaceClientProvider } from "@/provider/ably-provider";
import { NotificationProvider }  from "@/provider/notification-provider";

interface LayoutProps {
    children: React.ReactNode;
    params: Promise<{
        workspaceId: string;
    }>;
}

const Layout = async ({ children, params }: LayoutProps) => {
    const { workspaceId } = await params;

    return (
        <AblyWorkspaceClientProvider workspaceId={workspaceId}>
            <AblyChannelClientProvider
                channelName={`notification:workspace:${workspaceId}`}
            >
                <NotificationProvider workspaceId={workspaceId} />
                {children}
            </AblyChannelClientProvider>
        </AblyWorkspaceClientProvider>
    );
};

export default Layout;
