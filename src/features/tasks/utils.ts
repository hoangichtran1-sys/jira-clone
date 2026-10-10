import { DATABASES_ID, MEMBERS_ID } from "@/config/appwrite";
import { type TablesDB } from "node-appwrite";
import { Member } from "../members/types";

interface GetAssigneeUserProps {
    databases: TablesDB;
    assigneeId: string;
}

export const getAssigneeUser = async ({
    databases,
    assigneeId,
}: GetAssigneeUserProps) => {
    const member = await databases.getRow<Member>({
        databaseId: DATABASES_ID,
        tableId: MEMBERS_ID,
        rowId: assigneeId,
    });

    return member;
};
