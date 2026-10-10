import { MembersList } from "@/features/workspaces/components/members-list";
import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
    params: Promise<{
        workspaceId: string;
    }>;
}

const Page = async ({ params }: PageProps) => {
    const { workspaceId } = await params;

    await requireAuth();

    return (
        <div className="w-full lg:max-w-xl">
            <MembersList workspaceId={workspaceId} />
        </div>
    );
};

export default Page;
