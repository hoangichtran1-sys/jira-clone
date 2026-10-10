import { Card, CardContent } from "@/components/ui/card";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { Loader2Icon } from "lucide-react";
import { CreateTaskForm } from "./create-task-form";
import { useAtomValue } from "jotai";
import { taskStatusAtom } from "../atoms/task-status-atom";
import { ErrorResponse } from "@/types";
import { useEffect } from "react";
import { toast } from "sonner";

interface CreateTaskFormWrapperProps {
    onCancel: () => void;
}

export const CreateTaskFormWrapper = ({
    onCancel,
}: CreateTaskFormWrapperProps) => {
    const workspaceId = useWorkspaceId();

    const initialTaskStatus = useAtomValue(taskStatusAtom);

    const {
        data: projects,
        isLoading: isLoadingProjects,
        isError: isErrorProjects,
        error: errorProjects,
    } = useGetProjects({
        workspaceId,
    });
    const {
        data: members,
        isLoading: isLoadingMembers,
        isError: isErrorMembers,
        error: errorMembers,
    } = useGetMembers({
        workspaceId,
    });

    const projectOptions = projects?.rows.map((project) => ({
        id: project.$id,
        name: project.name,
        imageUrl: project.imageUrl,
    }));

    const memberOptions = members?.documents.map((member) => ({
        id: member.$id,
        name: member.name,
        userId: member.userId,
    }));

    const isLoading = isLoadingProjects || isLoadingMembers;
    const isError = isErrorMembers || isErrorProjects;

    useEffect(() => {
        if (isError) {
            const allError = Array(
                new Set([
                    errorMembers &&
                        (errorMembers as unknown as ErrorResponse).error,
                    errorProjects &&
                        (errorProjects as unknown as ErrorResponse).error,
                ]),
            );
            toast.error(allError.join("\n"));
        }
    }, [errorMembers, errorProjects, isError]);

    if (isLoading) {
        return (
            <Card className="w-full h-[714px border-none shadow-none]">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <CreateTaskForm
            onCancel={onCancel}
            projectOptions={projectOptions || []}
            memberOptions={memberOptions || []}
            initialTaskStatus={initialTaskStatus}
        />
    );
};
