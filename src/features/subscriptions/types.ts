import { Models } from "node-appwrite";

export type Subscription = Models.Document & {
    userId: string;
    subscriptionId: string;
    status: string;
};

export enum SubscriptionModalState {
    OPEN = "OPEN",
    CLOSE = "CLOSE",
}
