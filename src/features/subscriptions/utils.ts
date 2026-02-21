import { DATABASES_ID, SUBSCRIPTION_ID } from "@/config/appwrite";
import { Query, type Databases } from "node-appwrite";
import { Subscription } from "./types";

interface GetCurrentSubscriptionProps {
    databases: Databases;
    userId: string;
}

export const getCurrentSubscription = async ({
    databases,
    userId,
}: GetCurrentSubscriptionProps) => {
    const subscription = await databases.listDocuments<Subscription>(
        DATABASES_ID,
        SUBSCRIPTION_ID,
        [Query.equal("userId", userId)],
    );

    return subscription.documents[0] || null;
};
