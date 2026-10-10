import { requireAuth } from "@/lib/auth-utils";
import { Client } from "./client";

interface PageProps {
    params: Promise<{
        taskId: string;
        workspaceId: string;
    }>;
}

const Page = async ({ params }: PageProps) => {
    const { taskId } = await params;

    await requireAuth();

    return <Client taskId={taskId} />;
};

export default Page;
