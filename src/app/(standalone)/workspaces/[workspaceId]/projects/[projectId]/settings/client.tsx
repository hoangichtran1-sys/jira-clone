"use client";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { EditProjectForm } from "@/features/projects/components/edit-project-form";

interface ClientProps {
    projectId: string;
}

export const Client = ({ projectId }: ClientProps) => {
    const { data: project, isLoading } = useGetProject({ projectId });

    if (isLoading) {
        return <PageLoader />;
    }

    if (!project) {
        return <PageError message="Project not found" />;
    }

    return (
        <div className="w-full lg:max-w-xl">
            <EditProjectForm initialValues={project} />;
        </div>
    );
};
