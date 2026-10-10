import { requireAuth } from "@/lib/auth-utils";
import { Client } from "./client";

interface PageProps {
    params: Promise<{
        workspaceId: string;
    }>;
}

const Page = async ({ params }: PageProps) => {
    const { workspaceId } = await params;

    await requireAuth();

    return <Client workspaceId={workspaceId} />;
};

export default Page;
