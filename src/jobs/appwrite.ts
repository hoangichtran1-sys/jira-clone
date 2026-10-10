import { Client, Account, Users, TablesDB, Messaging } from "node-appwrite";

export async function createAdminClient() {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
        .setKey(process.env.APPWRITE_API_KEY!);

    return {
        get account() {
            return new Account(client);
        },
        get users() {
            return new Users(client);
        },
        get databases() {
            return new TablesDB(client);
        },
        get messaging() {
            return new Messaging(client);
        },
    };
}
