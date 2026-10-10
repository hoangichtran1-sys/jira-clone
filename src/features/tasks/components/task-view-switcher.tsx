"use client";

import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangleIcon, LoaderIcon, PlusIcon } from "lucide-react";
import { useCreateTaskModal } from "../hooks/use-create-task-modal";
import { useGetTasks } from "../api/use-get-tasks";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { DataFilters } from "./data-filters";
import { useTaskFilters } from "../hooks/use-task-filters";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { DataKanban } from "./data-kanban";
import { useCallback } from "react";
import { TaskStatus } from "../types";
import { useBulkUpdateTasks } from "../api/use-bulk-update-tasks";
import { DataCalendar } from "./data-calendar";
import { useBulkDeleteTasks } from "../api/use-bulk-delete-tasks";
import { useConfirm } from "@/hooks/use-confirm";
import { useAtomValue, useSetAtom } from "jotai";
import { taskViewAtom } from "../atoms/task-view-atom";
import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";
import { ErrorResponse } from "@/types";

interface TaskViewSwitcherProps {
    hideProjectFilter?: boolean;
    paramProjectId?: string;
}

export const TaskViewSwitcher = ({
    hideProjectFilter,
    paramProjectId,
}: TaskViewSwitcherProps) => {
    const [{ status, assigneeId, projectId, dueDate, search }] =
        useTaskFilters();

    const view = useAtomValue(taskViewAtom);
    const setView = useSetAtom(taskViewAtom);

    const { shouldBlock, triggerPaywall } = usePaywall();

    const onTypeChange = (type: string) => {
        if (type !== "table" && shouldBlock) {
            triggerPaywall();
            return;
        }

        setView(type);
    };

    const workspaceId = useWorkspaceId();
    const { open } = useCreateTaskModal();

    const {
        data: tasks,
        isLoading: isLoadingTasks,
        isError: isErrorTasks,
        error: errorTasks,
    } = useGetTasks({
        workspaceId,
        status,
        assigneeId,
        projectId: paramProjectId || projectId,
        dueDate,
        search,
    });

    const isError = isErrorTasks;
    const error = errorTasks && (errorTasks as unknown as ErrorResponse).error;

    const { mutate: bulkUpdateTasks } = useBulkUpdateTasks();
    const bulkDeleteTasks = useBulkDeleteTasks();

    const [DeleteDialog, confirmDelete] = useConfirm(
        "Delete Tasks",
        "This action cannot be undone.",
        "destructive",
    );

    const onKanbanChange = useCallback(
        (tasks: { $id: string; status: TaskStatus; position: number }[]) => {
            bulkUpdateTasks({ json: { tasks } });
        },
        [bulkUpdateTasks],
    );

    return (
        <>
            <DeleteDialog />
            <Tabs
                value={view}
                onValueChange={onTypeChange}
                className="flex-1 w-full border rounded-lg"
            >
                <div className="h-full flex flex-col overflow-auto p-4">
                    <div className="flex flex-col gap-y-2 lg:flex-row justify-between items-center">
                        <TabsList className="w-full lg:w-auto">
                            <TabsTrigger
                                className="h-8 w-full lg:auto"
                                value="table"
                            >
                                Table
                            </TabsTrigger>
                            <TabsTrigger
                                className="h-8 w-full lg:auto"
                                value="kanban"
                            >
                                Kanban
                            </TabsTrigger>
                            <TabsTrigger
                                className="h-8 w-full lg:auto"
                                value="calendar"
                            >
                                Calendar
                            </TabsTrigger>
                        </TabsList>
                        <Button
                            className="w-full lg:w-auto"
                            size="sm"
                            onClick={open}
                        >
                            <PlusIcon className="size-4" />
                            New
                        </Button>
                    </div>
                    <DottedSeparator className="my-4" />
                    <DataFilters hideProjectFilter={hideProjectFilter} />
                    <DottedSeparator className="my-4" />
                    {isError && (
                        <div className="w-full border rounded-lg h-[200px] flex flex-col items-center justify-center">
                            <AlertTriangleIcon className="size-5 text-muted-foreground" />
                            <p className="text-sm font-medium text-muted-foreground whitespace-pre-line">
                                {error}
                            </p>
                        </div>
                    )}
                    {isLoadingTasks ? (
                        <div className="w-full border rounded-lg h-[200px] flex flex-col items-center justify-center">
                            <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <TabsContent value="table" className="mt-0">
                                <DataTable
                                    columns={columns}
                                    data={tasks?.documents || []}
                                    onDelete={async (rows) => {
                                        const ok = await confirmDelete();
                                        if (!ok) return;
                                        const taskIds = rows.map(
                                            (row) => row.original.$id,
                                        );
                                        bulkDeleteTasks.mutateAsync({
                                            json: { taskIds },
                                        });
                                    }}
                                    disabled={
                                        bulkDeleteTasks.isPending ||
                                        isLoadingTasks
                                    }
                                />
                            </TabsContent>
                            <TabsContent value="kanban" className="mt-0">
                                <DataKanban
                                    onChange={onKanbanChange}
                                    data={tasks?.documents || []}
                                />
                            </TabsContent>
                            <TabsContent
                                value="calendar"
                                className="mt-0 h-full pb-4"
                            >
                                <DataCalendar data={tasks?.documents || []} />
                            </TabsContent>
                        </>
                    )}
                </div>
            </Tabs>
        </>
    );
};
