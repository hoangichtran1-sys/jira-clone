import { Models } from "node-appwrite";

export type ErrorResponse = {
    error: string;
    cause?: unknown;
};

export type UserTargetEmail = Models.Row & {
    userId: string;
    emailTargetId: string;
};

export type EmailJobData = {
    from?: string;
    email: string;
    subject: string;
    html: string;
};

export type SubscriptionStatus =
    "on_trial" | "active" | "paused" | "past_due" | "cancelled" | "expired";
