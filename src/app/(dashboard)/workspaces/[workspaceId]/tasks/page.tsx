import { TaskViewSwitcher } from "@/features/tasks/components/task-view-switcher";
import { requireAuth } from "@/lib/auth-utils";

const Page = async () => {
    await requireAuth();

    return (
        <div className="h-full flex flex-col">
            <TaskViewSwitcher />
        </div>
    );
};

export default Page;
