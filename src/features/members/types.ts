import { Models } from "node-appwrite";

export enum MemberRole {
    ADMIN = "ADMIN",
    MEMBER = "MEMBER",
}

export enum PresenceEvent {
    ABSENT = 0,
    PRESENT = 1,
    ENTER = 2,
    LEAVE = 3,
    UPDATE = 4,
}

export type Member = Models.Document & {
    userId: string;
    workspaceId: string;
    role: MemberRole;
    subscriberId: string;
    lastSeen?: string;
};
