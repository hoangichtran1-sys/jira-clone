import { DATABASES_ID, MEMBERS_ID } from "@/config/appwrite";
import { Query, type Databases } from "node-appwrite";
import { Member } from "./types";

interface GetMemberProps {
    databases: Databases;
    workspaceId: string;
    userId: string;
}

export const getMember = async ({
    databases,
    workspaceId,
    userId
}: GetMemberProps) => {
    const members = await databases.listDocuments<Member>(
        DATABASES_ID,
        MEMBERS_ID,
        [
            Query.equal("workspaceId", workspaceId),
            Query.equal("userId", userId),
        ]
    )

    return members.documents[0];
}