import { getCurrent } from "@/features/auth/queries";
import { redirect } from "next/navigation";
import { Client } from "./client";

interface PageProps {
    params: Promise<{
        taskId: string;
    }>;
}

const Page = async ({ params }: PageProps) => {
    const user = await getCurrent();

    if (!user) redirect("/sign-in");

    const { taskId } = await params;

    return <Client taskId={taskId} />;
};

export default Page;
