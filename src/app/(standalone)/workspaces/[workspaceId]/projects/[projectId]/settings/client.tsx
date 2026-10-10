"use client";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { EditProjectForm } from "@/features/projects/components/edit-project-form";
import { ErrorResponse } from "@/types";

interface ClientProps {
    projectId: string;
}

export const Client = ({ projectId }: ClientProps) => {
    const {
        data: project,
        isLoading,
        isError,
        error,
    } = useGetProject({ projectId });

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        const err = (error as unknown as ErrorResponse).error;

        return <PageError message={err} />;
    }

    if (!project) {
        return <PageError message="Failed to fetch project" />;
    }

    return (
        <div className="w-full lg:max-w-xl">
            <EditProjectForm initialValues={project} />;
        </div>
    );
};
