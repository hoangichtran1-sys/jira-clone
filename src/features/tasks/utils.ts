import { DATABASES_ID, MEMBERS_ID } from "@/config/appwrite";
import { type Databases } from "node-appwrite";
import { Member } from "../members/types";

interface GetAssigneeUserProps {
    databases: Databases;
    assigneeId: string;
}

export const getAssigneeUser = async ({
    databases,
    assigneeId,
}: GetAssigneeUserProps) => {
    const member = await databases.getDocument<Member>(
        DATABASES_ID,
        MEMBERS_ID,
        assigneeId,
    )

    return member;
}