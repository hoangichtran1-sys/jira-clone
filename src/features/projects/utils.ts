import { DATABASES_ID, PROJECTS_ID } from "@/config/appwrite";
import { Query, type Databases } from "node-appwrite";
import { Project } from "./types";

interface GetCurrentProjectsProps {
    databases: Databases;
    workspaceId: string;
}

export const getCurrentProjects = async ({
    databases,
    workspaceId,
}: GetCurrentProjectsProps) => {
    const currentProjectsInWorkspace = await databases.listDocuments<Project>(
        DATABASES_ID,
        PROJECTS_ID,
        [
            Query.equal("workspaceId", workspaceId),
        ],
    );

    return currentProjectsInWorkspace.documents || [];
};
