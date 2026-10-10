//import { COOKIE_MAX_AGE } from "@/constants";
import { Client, Account, Avatars } from "appwrite";

export const appwrite = {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
    // cookieOptions: {
    //     maxAge: COOKIE_MAX_AGE,
    // },
};

export function createNextClient() {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
    return {
        get account() {
            return new Account(client);
        },
        get avatars() {
            return new Avatars(client);
        },
    };
}
