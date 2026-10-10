"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Analytics } from "@/components/analytics";
import { DottedSeparator } from "@/components/dotted-separator";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useCreateProjectModal } from "@/features/projects/hooks/use-create-project-modal";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useCreateTaskModal } from "@/features/tasks/hooks/use-create-task-modal";
import { TaskPopulated } from "@/features/tasks/types";
import { useGetWorkspaceAnalytics } from "@/features/workspaces/api/use-get-workspace-analytics";
import { PlusIcon, CalendarIcon, SettingsIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Project } from "@/features/projects/types";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { Member, MemberRole } from "@/features/members/types";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePresenceListener } from "ably/react";
import { Hint } from "@/components/hint";
import { ErrorResponse } from "@/types";

interface ClientProps {
    workspaceId: string;
}

export const Client = ({ workspaceId }: ClientProps) => {
    const {
        data: analytics,
        isLoading: isLoadingAnalytics,
        isError: isErrorAnalytics,
        error: errorAnalytics,
    } = useGetWorkspaceAnalytics({ workspaceId });
    const {
        data: tasks,
        isLoading: isLoadingTasks,
        isError: isErrorTasks,
        error: errorTasks,
    } = useGetTasks({
        workspaceId,
    });
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

    const isLoading =
        isLoadingAnalytics ||
        isLoadingTasks ||
        isLoadingProjects ||
        isLoadingMembers;
    const isError =
        isErrorAnalytics || isErrorMembers || isErrorProjects || isErrorTasks;

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        const allError = Array(
            new Set([
                errorAnalytics &&
                    (errorAnalytics as unknown as ErrorResponse).error,
                errorMembers &&
                    (errorMembers as unknown as ErrorResponse).error,
                errorProjects &&
                    (errorProjects as unknown as ErrorResponse).error,
                errorTasks && (errorTasks as unknown as ErrorResponse).error,
            ]),
        );

        return <PageError message={allError.join("\n")} />;
    }

    if (!analytics || !tasks || !projects || !members) {
        return <PageError message="Failed to load workspace data" />;
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            <Analytics data={analytics} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <TaskList
                    workspaceId={workspaceId}
                    data={tasks.documents}
                    total={tasks.total}
                />
                <ProjectList
                    workspaceId={workspaceId}
                    data={projects.rows}
                    total={projects.total}
                />
                <MembersList
                    workspaceId={workspaceId}
                    data={members.documents}
                    total={members.total}
                />
            </div>
        </div>
    );
};

interface TaskListProps {
    data: TaskPopulated[];
    total: number;
    workspaceId: string;
}

export const TaskList = ({ workspaceId, data, total }: TaskListProps) => {
    const { open: createTask } = useCreateTaskModal();

    return (
        <div className="flex flex-col gap-y-4 col-span-1">
            <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">Tasks ({total})</p>
                    <Button variant="muted" size="icon" onClick={createTask}>
                        <PlusIcon className="size-4 text-neutral-400" />
                    </Button>
                </div>
                <DottedSeparator className="my-4" />
                <ul className="flex flex-col gap-y-4">
                    {data.map((task) => (
                        <li key={task.$id}>
                            <Link
                                href={`/workspaces/${workspaceId}/tasks/${task.$id}`}
                            >
                                <Card className="shadow-none rounded-lg hover:opacity-75 transition">
                                    <CardContent className="p-4">
                                        <p className="text-lg font-medium truncate">
                                            {task.name}
                                        </p>
                                        <div className="flex items-center gap-x-2">
                                            <p>{task.project.name}</p>
                                            <div className="size-1 rounded-full bg-neutral-300" />
                                            <div className="text-sm text-muted-foreground flex items-center">
                                                <CalendarIcon className="size-3 mr-1" />
                                                <span className="truncate">
                                                    {formatDistanceToNow(
                                                        new Date(task.dueDate),
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </li>
                    ))}
                    <li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
                        No tasks found
                    </li>
                </ul>
                <Button variant="muted" className="mt-4 w-full" asChild>
                    <Link href={`/workspaces/${workspaceId}/tasks`}>
                        Show All
                    </Link>
                </Button>
            </div>
        </div>
    );
};

interface ProjectListProps {
    data: Project[];
    total: number;
    workspaceId: string;
}

export const ProjectList = ({ workspaceId, data, total }: ProjectListProps) => {
    const { open: createProject } = useCreateProjectModal();

    return (
        <div className="flex flex-col gap-y-4 col-span-1">
            <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">Projects ({total})</p>
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={createProject}
                    >
                        <PlusIcon className="size-4 text-neutral-400" />
                    </Button>
                </div>
                <DottedSeparator className="my-4" />
                <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {data.map((project) => (
                        <li key={project.$id}>
                            <Link
                                href={`/workspaces/${workspaceId}/projects/${project.$id}`}
                            >
                                <Card className="shadow-none rounded-lg hover:opacity-75 transition">
                                    <CardContent className="p-4 flex items-center gap-x-2.5">
                                        <ProjectAvatar
                                            name={project.name}
                                            image={project.imageUrl}
                                            className="size-12"
                                            fallbackClassName="text-lg"
                                        />
                                        <p className="text-lg font-medium truncate">
                                            {project.name}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </li>
                    ))}
                    <li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
                        No projects found
                    </li>
                </ul>
            </div>
        </div>
    );
};

interface MembersListProps {
    data: (Member & {
        name?: string;
        email: string;
    })[];
    total: number;
    workspaceId: string;
}

export const MembersList = ({ workspaceId, data, total }: MembersListProps) => {
    const { presenceData } = usePresenceListener(
        `notification:workspace:${workspaceId}`,
    );

    console.log(presenceData);

    const checkOnline = (userId: string) => {
        return presenceData.some(
            (msg) => msg.clientId === `jira-client.${userId}`,
        );
    };

    return (
        <div className="flex flex-col gap-y-4 col-span-1">
            <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">Members ({total})</p>
                    <Button variant="secondary" size="icon" asChild>
                        <Link href={`/workspaces/${workspaceId}/members`}>
                            <SettingsIcon className="size-4 text-neutral-400" />
                        </Link>
                    </Button>
                </div>
                <DottedSeparator className="my-4" />
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.map((member) => {
                        const isOnline = checkOnline(member.userId);
                        const lastSeenText = member.lastSeen
                            ? `Truy cập ${formatDistanceToNow(new Date(member.lastSeen), { addSuffix: true, locale: vi })}`
                            : "Chưa rõ thời gian truy cập";
                        return (
                            <li key={member.$id}>
                                <Card className="shadow-none rounded-lg overflow-hidden">
                                    <CardContent className="p-3 flex flex-col items-center gap-x-2">
                                        <Hint
                                            html={
                                                <div className="flex flex-col gap-y-0.5">
                                                    <p className="font-bold">
                                                        {isOnline
                                                            ? "Đang trực tuyến"
                                                            : "Ngoại tuyến"}
                                                    </p>
                                                    {!isOnline && (
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {lastSeenText}
                                                        </p>
                                                    )}
                                                </div>
                                            }
                                            side="right"
                                            className="text-xs"
                                        >
                                            <div className="relative">
                                                <MemberAvatar
                                                    name={
                                                        member.name ||
                                                        member.email
                                                    }
                                                    avatarUserId={member.userId}
                                                    className="size-12"
                                                />
                                                <span
                                                    className={cn(
                                                        "absolute bottom-0 right-0 size-3.5 border-2 border-white rounded-full cursor-help shadow-sm",
                                                        isOnline
                                                            ? "bg-emerald-500"
                                                            : "bg-red-500",
                                                    )}
                                                />
                                            </div>
                                        </Hint>
                                        <p>{member.name}</p>
                                        <div className="flex flex-col items-center overflow-hidden">
                                            <p className="text-lg font-medium line-clamp-1">
                                                {member.name || member.email}
                                            </p>
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {member.email}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-white",
                                                    member.role ===
                                                        MemberRole.ADMIN
                                                        ? "bg-emerald-500 hover:bg-emerald-600"
                                                        : "bg-cyan-500 hover:bg-cyan-600",
                                                )}
                                            >
                                                {member.role ===
                                                MemberRole.ADMIN
                                                    ? "Admin"
                                                    : "Member"}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </li>
                        );
                    })}
                    <li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
                        No members found
                    </li>
                </ul>
            </div>
        </div>
    );
};
