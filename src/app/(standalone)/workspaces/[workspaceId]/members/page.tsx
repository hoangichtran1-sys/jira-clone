import { getCurrent } from "@/features/auth/queries";
import { MembersList } from "@/features/workspaces/components/members-list";
import { redirect } from "next/navigation";

interface PageProps {
    params: Promise<{
        workspaceId: string;
    }>;
}

const Page = async ({ params }: PageProps) => {
    const user = await getCurrent();

    if (!user) redirect("/sign-in");

    const { workspaceId } = await params;

    return (
        <div className="w-full lg:max-w-xl">
            <MembersList workspaceId={workspaceId} />
        </div>
    );
};

export default Page;
