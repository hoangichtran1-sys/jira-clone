import { Client } from "./client";
import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
    params: Promise<{
        projectId: string;
        workspaceId: string;
    }>;
}

const Page = async ({ params }: PageProps) => {
    const { projectId } = await params;

    await requireAuth();

    return <Client projectId={projectId} />;
};

export default Page;
