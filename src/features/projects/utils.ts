import { DATABASES_ID, PROJECTS_ID } from "@/config/appwrite";
import { Query, type TablesDB } from "node-appwrite";
import { Project } from "./types";

interface GetCurrentProjectsProps {
    databases: TablesDB;
    workspaceId: string;
}

export const getCurrentProjects = async ({
    databases,
    workspaceId,
}: GetCurrentProjectsProps) => {
    const currentProjectsInWorkspace = await databases.listRows<Project>({
        databaseId: DATABASES_ID,
        tableId: PROJECTS_ID,
        queries: [Query.equal("workspaceId", workspaceId)],
    });

    return currentProjectsInWorkspace.rows;
};
