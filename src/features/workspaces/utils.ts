import {
    DATABASES_ID,
    USER_TARGET_EMAIL_ID,
    WORKSPACES_ID,
} from "@/config/appwrite";
import {
    Query,
    type Databases,
} from "node-appwrite";
import { Workspace } from "./types";
import { getMember } from "../members/utils";
import { MemberRole } from "../members/types";
import validate from "deep-email-validator";
import { UserTargetEmail } from "@/types";

export async function validateEmail(email: string) {
    const result = await validate({
        email,
        validateTypo: true,
        validateSMTP: false, // bật true nếu muốn kiểm tra SMTP
    });

    return result;
}

interface GetCurrentWorkspacesIsAdminProps {
    databases: Databases;
    userId: string;
}

export const getCurrentWorkspacesIsAdmin = async ({
    databases,
    userId,
}: GetCurrentWorkspacesIsAdminProps) => {
    const currentWorkspaces = await databases.listDocuments<Workspace>(
        DATABASES_ID,
        WORKSPACES_ID,
        [Query.equal("userId", userId)],
    );

    const currentWorkspacesAndRole = await Promise.all(
        currentWorkspaces.documents.map(async (workspace) => {
            const members = await getMember({
                databases,
                workspaceId: workspace.$id,
                userId,
            });

            return {
                ...workspace,
                role: members.role,
            };
        }),
    );

    const currentWorkspacesIsAdmin = currentWorkspacesAndRole.filter(
        (workspace) => workspace.role === MemberRole.ADMIN,
    );

    return currentWorkspacesIsAdmin || [];
};

interface EnsureEmailTargetProps {
    databases: Databases;
    userId: string;
}

export async function ensureEmailTarget({
    databases,
    userId,
}: EnsureEmailTargetProps) {
    const userTarget = await databases.listDocuments<UserTargetEmail>(
        DATABASES_ID,
        USER_TARGET_EMAIL_ID,
        [
            Query.equal("userId", userId)
        ]
    )
    if (userTarget.documents.length === 0) {
        return null;
    }

    return userTarget.documents[0].emailTargetId;
}
