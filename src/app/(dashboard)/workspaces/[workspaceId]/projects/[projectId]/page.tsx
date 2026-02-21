import { getCurrent } from "@/features/auth/queries";
import { redirect } from "next/navigation";
import { Client}  from "./client";

interface PageProps {
    params: Promise<{
        projectId: string;
    }>;
}

const Page = async ({ params }: PageProps) => {
    const user = await getCurrent();

    if (!user) redirect("/sign-in");

    const { projectId } = await params;

    return <Client projectId={projectId} />
};

export default Page;
