import { DATABASES_ID, SUBSCRIPTION_ID } from "@/config/appwrite";
import { Query, type TablesDB } from "node-appwrite";
import { Subscription } from "./types";

interface GetCurrentSubscriptionProps {
    databases: TablesDB;
    userId: string;
}

export const getCurrentSubscription = async ({
    databases,
    userId,
}: GetCurrentSubscriptionProps) => {
    const subscription = await databases.listRows<Subscription>({
        databaseId: DATABASES_ID,
        tableId: SUBSCRIPTION_ID,
        queries: [Query.equal("userId", userId)],
    });

    if (subscription.total === 0) {
        return null;
    }

    return subscription.rows[0];
};
