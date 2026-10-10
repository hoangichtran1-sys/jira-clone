import { getWorkspaces } from "@/features/workspaces/actions";
import { requireAuth } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

const Page = async () => {
    const { session, user } = await requireAuth();

    const workspaces = await getWorkspaces({ sessionValue: session, user });

    if (workspaces.total === 0) {
        redirect("/workspaces/create");
    } else {
        redirect(`/workspaces/${workspaces.rows[0].$id}`);
    }
};

export default Page;
