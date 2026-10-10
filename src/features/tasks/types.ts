import { Models } from "node-appwrite";
import { Project } from "../projects/types";
import { MemberPopulated } from "../members/types";

export enum TaskStatus {
    BACKLOG = "BACKLOG",
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    IN_REVIEW = "IN_REVIEW",
    DONE = "DONE",
}

export type Task = Models.Row & {
    workspaceId: string;
    name: string;
    status: TaskStatus;
    assigneeId: string;
    projectId: string;
    position: number;
    dueDate: string;
    description?: string;
};

export type TaskPopulated = Task & {
    project: Project;
    assignee: MemberPopulated | undefined;
};

export enum TaskView {
    TABLE = "table",
    KANBAN = "kanban",
    CALENDAR = "calendar",
}
