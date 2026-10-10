"use client";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info";
import { JoinWorkspaceForm } from "@/features/workspaces/components/join-workspace-form";
import { ErrorResponse } from "@/types";

interface ClientProps {
    workspaceId: string;
    inviteCode: string;
}

export const Client = ({ workspaceId, inviteCode }: ClientProps) => {
    const {
        data: workspaceInfo,
        isLoading,
        isError,
        error,
    } = useGetWorkspaceInfo({
        workspaceId,
    });

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        const err = (error as unknown as ErrorResponse).error;

        return <PageError message={err} />;
    }

    if (!workspaceInfo) {
        return <PageError message="Failed to fetch workspace info" />;
    }

    return (
        <div className="w-full lg:max-w-xl">
            <JoinWorkspaceForm
                imageUrl={workspaceInfo.imageUrl}
                inviteCode={inviteCode}
                name={workspaceInfo.name}
                membersInfo={workspaceInfo.members}
            />
        </div>
    );
};
