import { DATABASES_ID, WORKSPACES_ID, MEMBERS_ID } from "@/config/appwrite";
import { Query, type Models } from "node-appwrite";
import { Workspace } from "./types";
import { createSessionClient } from "@/lib/appwrite";
import { Member } from "../members/types";

interface GetWorkspaces {
    sessionValue: string;
    user: Models.User<Models.Preferences>;
}

export const getWorkspaces = async ({ sessionValue, user }: GetWorkspaces) => {
    const { databases } = await createSessionClient(sessionValue);

    const members = await databases.listRows<Member>({
        databaseId: DATABASES_ID,
        tableId: MEMBERS_ID,
        queries: [Query.equal("userId", user.$id)],
    });

    if (members.total === 0) {
        return { rows: [], total: 0 };
    }

    const workspaceIds = members.rows.map((member) => member.workspaceId);

    const workspaces = await databases.listRows<Workspace>({
        databaseId: DATABASES_ID,
        tableId: WORKSPACES_ID,
        queries: [
            Query.orderDesc("$createdAt"),
            Query.contains("$id", workspaceIds),
        ],
    });

    return workspaces;
};
