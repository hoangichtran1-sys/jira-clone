import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLinkIcon, PencilIcon, TrashIcon } from "lucide-react";
import React from "react";
import { useDeleteTask } from "../api/use-delete-task";
import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useRouter } from "next/navigation";
import { useEditTaskModal } from "../hooks/use-edit-task-modal";

interface TaskActionProps {
    id: string;
    projectId: string;
    children: React.ReactNode;
}

export const TaskActions = ({ id, projectId, children }: TaskActionProps) => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();
    const deleteTask = useDeleteTask();

    const { open } = useEditTaskModal();

    const [ConfirmDialog, confirm] = useConfirm(
        "Delete task",
        "This action cannot be undone.",
        "destructive",
    );

    const handleDelete = async () => {
        const ok = await confirm();
        if (!ok) return;

        deleteTask.mutateAsync({ param: { taskId: id } });
    };

    const onOpenTask = () => {
        router.push(`/workspaces/${workspaceId}/tasks/${id}`);
    };

    const onOpenProject = () => {
        router.push(`/workspaces/${workspaceId}/projects/${projectId}`);
    };

    return (
        <div className="flex justify-end">
            <ConfirmDialog />
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                        onClick={onOpenTask}
                        className="font-medium p-[10px]"
                    >
                        <ExternalLinkIcon className="size-4 stroke-2" />
                        Task Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={onOpenProject}
                        className="font-medium p-[10px]"
                    >
                        <ExternalLinkIcon className="size-4 stroke-2" />
                        Open Project
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => open(id)}
                        className="font-medium p-[10px]"
                    >
                        <PencilIcon className="size-4 stroke-2" />
                        Edit task
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={handleDelete}
                        disabled={deleteTask.isPending}
                        className="text-amber-700 focus:text-amber-700 font-medium p-[10px]"
                    >
                        <TrashIcon className="size-4 stroke-2" />
                        Delete task
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
