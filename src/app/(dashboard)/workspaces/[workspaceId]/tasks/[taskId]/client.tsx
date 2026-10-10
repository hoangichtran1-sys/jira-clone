"use client";

import { DottedSeparator } from "@/components/dotted-separator";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { useGetTask } from "@/features/tasks/api/use-get-task";
import { TaskBreadcrumbs } from "@/features/tasks/components/task-breadcrumbs";
import { TaskDescription } from "@/features/tasks/components/task-description";
import { TaskOverview } from "@/features/tasks/components/task-overview";
import { ErrorResponse } from "@/types";

interface ClientProps {
    taskId: string;
}

export const Client = ({ taskId }: ClientProps) => {
    const { data, isLoading, isError, error } = useGetTask({ taskId });

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        const err = (error as unknown as ErrorResponse).error;

        return <PageError message={err} />;
    }

    if (!data) {
        return <PageError message="Failed to fetch task" />;
    }

    return (
        <div className="flex flex-col">
            <TaskBreadcrumbs project={data.project} task={data} />
            <DottedSeparator className="my-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TaskOverview task={data} />
                <TaskDescription task={data} />
            </div>
        </div>
    );
};
