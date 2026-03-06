import { Models } from "node-appwrite";

export type ErrorResponse = {
    error: string;
    type?: string;
};


export type UserTargetEmail = Models.Document & {
    userId: string;
    emailTargetId: string;
}