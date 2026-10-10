import { Card, CardContent } from "@/components/ui/card";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { Loader2Icon } from "lucide-react";
import { NotificationWorkspaceForm } from "./notification-workspace-form";
import { useAtomValue } from "jotai";
import { userIdAtom } from "@/features/auth/atoms/user-id-atom";
import { ErrorResponse } from "@/types";
import { useEffect } from "react";
import { toast } from "sonner";

interface NotificationWorkspaceFormWrapperProps {
    onCancel: () => void;
}

export const NotificationWorkspaceFormWrapper = ({
    onCancel,
}: NotificationWorkspaceFormWrapperProps) => {
    const workspaceId = useWorkspaceId();

    const {
        data: members,
        isLoading: isLoadingMembers,
        isError,
        error,
    } = useGetMembers({
        workspaceId,
    });

    const currentUserId = useAtomValue(userIdAtom);
    const memberOptions = members?.documents.map((member) => ({
        id: member.$id,
        name: member.name,
        receiverId: member.userId,
    }));

    const memberOptionsFilter = memberOptions?.filter(
        (member) => member.receiverId !== currentUserId,
    );

    const isLoading = isLoadingMembers || currentUserId === null;

    useEffect(() => {
        if (isError) {
            const err = (error as unknown as ErrorResponse).error;
            toast.error(err);
        }
    }, [isError, error]);

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
        <NotificationWorkspaceForm
            onCancel={onCancel}
            memberOptions={memberOptionsFilter || []}
            currentUserId={currentUserId}
            workspaceId={workspaceId}
        />
    );
};
