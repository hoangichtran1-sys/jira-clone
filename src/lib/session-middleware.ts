import "server-only";

import {
    Account,
    Client,
    Databases,
    Models,
    Storage,
    type Account as AccountType,
    type Databases as DatabasesType,
    type Storage as StorageType,
    type Users as UsersType,
} from "node-appwrite";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

import { AUTH_COOKIE } from "@/features/auth/constants";

export type AdditionalContext = {
    Variables: {
        account: AccountType;
        databases: DatabasesType;
        storage: StorageType;
        users: UsersType;
        user: Models.User<Models.Preferences>;
    };
};

export const sessionMiddleware = createMiddleware<AdditionalContext>(
    async (c, next) => {
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

        const session = getCookie(c, AUTH_COOKIE);

        if (!session) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        client.setSession(session);

        const account = new Account(client);
        const databases = new Databases(client);
        const storage = new Storage(client);

        let user;
        try {
            user = await account.get();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("account.get failed", err);
            return c.json({ error: "Unauthorized" }, 401);
        }

        c.set("account", account);
        c.set("databases", databases);
        c.set("storage", storage);
        c.set("user", user);

        await next();
    },
);
