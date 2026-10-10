import { HTTPException } from "hono/http-exception";
import {
    Account,
    Client,
    TablesDB,
    Models,
    Storage,
    type Account as AccountType,
    type TablesDB as TablesDBType,
    type Storage as StorageType,
    type Users as UsersType,
} from "node-appwrite";
import { createMiddleware } from "hono/factory";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { appwrite } from "./appwrite-client";

export type AdditionalContext = {
    Variables: {
        account: AccountType;
        databases: TablesDBType;
        storage: StorageType;
        users: UsersType;
        user: Models.User<Models.Preferences>;
    };
};

export const sessionMiddleware = createMiddleware<AdditionalContext>(
    async (c, next) => {
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

        const helpers = createNextServerHelpers(appwrite);

        const session = await helpers.readSessionCookie();

        if (!session) {
            throw new HTTPException(401, { message: "Unauthorized" });
        }

        const user = await helpers.getLoggedInUser();

        if (!user) {
            throw new HTTPException(401, { message: "Unauthorized" });
        }

        client.setSession(session);

        const account = new Account(client);
        const databases = new TablesDB(client);
        const storage = new Storage(client);

        c.set("account", account);
        c.set("databases", databases);
        c.set("storage", storage);
        c.set("user", user);

        await next();
    },
);
