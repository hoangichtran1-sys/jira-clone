import { Models } from "node-appwrite";

export type ErrorResponse = {
    error: string;
    type?: string;
};


export type UserTargetEmail = Models.Document & {
    userId: string;
    emailTargetId: string;
}

export type EmailJobData = {
    from: string;
    email: string;
    subject: string;
    html: string;
};