import { Client } from "./client";
import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
    params: Promise<{
        workspaceId: string;
        inviteCode: string;
    }>;
}

const Page = async ({ params }: PageProps) => {
    await requireAuth();

    const { workspaceId, inviteCode } = await params;

    return <Client workspaceId={workspaceId} inviteCode={inviteCode} />;
};

export default Page;
