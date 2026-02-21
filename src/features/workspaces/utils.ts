import { DATABASES_ID, WORKSPACES_ID } from "@/config/appwrite";
import { Query, type Databases } from "node-appwrite";
import { Workspace } from "./types";
import { getMember } from "../members/utils";
import { MemberRole } from "../members/types";

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