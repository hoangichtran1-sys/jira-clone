import { getCurrent } from "@/features/auth/queries";
import { redirect } from "next/navigation";
import { Client } from "./client";

interface PageProps {
    params: Promise<{
        workspaceId: string;
    }>;
}

const Page = async ({ params }: PageProps) => {
    const user = await getCurrent();

    if (!user) redirect("/sign-in");

    const { workspaceId } = await params;

    return <Client workspaceId={workspaceId} />;
};

export default Page;
