/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { redirect } from "next/navigation";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { Query } from "node-appwrite";

import { DATABASES_ID, MEMBERS_ID } from "@/config/appwrite";
import { Member } from "@/features/members/types";
import { appwrite } from "./appwrite-client";
import { createSessionClient } from "./appwrite";

export const requireAuth = async () => {
    const helpers = createNextServerHelpers(appwrite);

    try {
        const session = await helpers.readSessionCookie();
        if (!session) {
            redirect("/sign-in");
        }

        const user = await helpers.getLoggedInUser();
        if (!user) {
            redirect("/sign-in");
        }

        return { user, session };
    } catch (error: any) {
        // 1. QUAN TRỌNG: Nếu lỗi chính là lệnh redirect của Next.js, phải ném lại nó!
        if (error?.digest?.includes("NEXT_REDIRECT")) {
            throw error;
        }
        console.log(error);
        redirect("/sign-in");
    }
};

export const requireUnauth = async () => {
    const helpers = createNextServerHelpers(appwrite);

    const session = await helpers.readSessionCookie();
    const user = await helpers.getLoggedInUser();

    if (session && user) {
        redirect("/");
    }
};

export const requireMember = async (workspaceId: string) => {
    const { user, session } = await requireAuth();

    const { databases } = await createSessionClient(session);

    const members = await databases.listRows<Member>({
        databaseId: DATABASES_ID,
        tableId: MEMBERS_ID,
        queries: [
            Query.equal("workspaceId", workspaceId),
            Query.equal("userId", user.$id),
        ],
    });

    if (members.total === 0) {
        redirect("/");
    }

    return members;
};
