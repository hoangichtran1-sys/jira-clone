import { DATABASES_ID, MEMBERS_ID } from "@/config/appwrite";
import { Query, type TablesDB } from "node-appwrite";
import { Member } from "./types";

interface GetMemberProps {
    databases: TablesDB;
    workspaceId: string;
    userId: string;
}

export const getMember = async ({
    databases,
    workspaceId,
    userId,
}: GetMemberProps) => {
    const members = await databases.listRows<Member>({
        databaseId: DATABASES_ID,
        tableId: MEMBERS_ID,
        queries: [
            Query.equal("workspaceId", workspaceId),
            Query.equal("userId", userId),
        ],
    });

    if (members.total === 0) {
        return null;
    }

    return members.rows[0];
};
