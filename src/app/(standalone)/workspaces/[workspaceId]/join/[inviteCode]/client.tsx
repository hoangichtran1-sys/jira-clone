"use client";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info";
import { JoinWorkspaceForm } from "@/features/workspaces/components/join-workspace-form";

interface ClientProps {
    workspaceId: string;
    inviteCode: string;
}

export const Client = ({ workspaceId, inviteCode }: ClientProps) => {
    const { data: workspaceInfo, isLoading } = useGetWorkspaceInfo({ workspaceId });

    if (isLoading) {
        return <PageLoader />;
    }

    if (!workspaceInfo) {
        return <PageError message="Workspace info missing" />;
    }

    return (
        <div className="w-full lg:max-w-xl">
            <JoinWorkspaceForm imageUrl={workspaceInfo.imageUrl} inviteCode={inviteCode} name={workspaceInfo.name} />
        </div>
    );
};
