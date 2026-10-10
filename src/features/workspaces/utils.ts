import {
    DATABASES_ID,
    USER_TARGET_EMAIL_ID,
    WORKSPACES_ID,
} from "@/config/appwrite";
import { Query, type TablesDB } from "node-appwrite";
import { Workspace } from "./types";
import { getMember } from "../members/utils";
import { MemberRole } from "../members/types";
import validate from "deep-email-validator";
import { UserTargetEmail } from "@/types";

export async function validateEmail(email: string) {
    const result = await validate({
        email,
        validateTypo: true,
        validateSMTP: false,
    });

    return result;
}

interface GetCurrentWorkspacesIsAdminProps {
    databases: TablesDB;
    userId: string;
}

export const getCurrentWorkspacesIsAdmin = async ({
    databases,
    userId,
}: GetCurrentWorkspacesIsAdminProps) => {
    const currentWorkspaces = await databases.listRows<Workspace>({
        databaseId: DATABASES_ID,
        tableId: WORKSPACES_ID,
        queries: [Query.equal("userId", userId)],
    });

    const currentWorkspacesAndRole = await Promise.all(
        currentWorkspaces.rows.map(async (workspace) => {
            const members = await getMember({
                databases,
                workspaceId: workspace.$id,
                userId,
            });

            return {
                ...workspace,
                role: members?.role,
            };
        }),
    );

    const currentWorkspacesIsAdmin = currentWorkspacesAndRole.filter(
        (workspace) => workspace.role === MemberRole.ADMIN,
    );

    return currentWorkspacesIsAdmin;
};

interface EnsureEmailTargetProps {
    databases: TablesDB;
    userId: string;
}

export async function ensureEmailTarget({
    databases,
    userId,
}: EnsureEmailTargetProps) {
    const userTarget = await databases.listRows<UserTargetEmail>({
        databaseId: DATABASES_ID,
        tableId: USER_TARGET_EMAIL_ID,
        queries: [Query.equal("userId", userId)],
    });
    if (userTarget.rows.length === 0) {
        return null;
    }

    return userTarget.rows[0].emailTargetId;
}
