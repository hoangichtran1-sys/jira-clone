"use client";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { EditWorkspaceForm } from "@/features/workspaces/components/edit-workspace-form";
import { ErrorResponse } from "@/types";

interface ClientProps {
    workspaceId: string;
}

export const Client = ({ workspaceId }: ClientProps) => {
    const {
        data: workspace,
        isLoading,
        isError,
        error,
    } = useGetWorkspace({ workspaceId });

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        const err = (error as unknown as ErrorResponse).error;

        return <PageError message={err} />;
    }

    if (!workspace) {
        return <PageError message="Failed to fetch workspace" />;
    }

    return (
        <div className="w-full lg:max-w-xl">
            <EditWorkspaceForm initialValues={workspace} />
        </div>
    );
};
