import { getCurrent } from "@/features/auth/queries";
import { redirect } from "next/navigation";
import { Client } from "./client";

interface PageProps {
    params: Promise<{
        workspaceId: string;
        inviteCode: string;
    }>;
}

const Page = async ({ params }: PageProps) => {
    const user = await getCurrent();

    if (!user) redirect("/sign-in");

    const { workspaceId, inviteCode } = await params;

    return <Client workspaceId={workspaceId} inviteCode={inviteCode} />;
};

export default Page;
