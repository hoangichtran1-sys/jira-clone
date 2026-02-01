import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { loginSchema, registerSchema } from "../schemas";
import { createAdminClient } from "@/lib/appwrite";
import { AppwriteException, ID } from "node-appwrite";
import { setCookie, deleteCookie } from "hono/cookie";
import { AUTH_COOKIE, MAX_AGE_SESSION } from "../constants";
import { sessionMiddleware } from "@/lib/session-middleware";
import { toHttpStatus } from "@/lib/utils";

const app = new Hono()
    .get("/current", sessionMiddleware, (c) => {
        const user = c.get("user");

        return c.json({ data: user });
    })
    .post("/login", zValidator("json", loginSchema), async (c) => {
        const { email, password } = c.req.valid("json");
        try {
            const { account } = await createAdminClient();
            const session = await account.createEmailPasswordSession(
                email,
                password,
            );

            setCookie(c, AUTH_COOKIE, session.secret, {
                path: "/",
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: MAX_AGE_SESSION,
            });

            return c.json({ success: true });
        } catch (error) {
            if (error instanceof AppwriteException) {
                return c.json(
                    {
                        error: error.message,
                        type: error.type,
                    },
                    toHttpStatus(error.code)
                );
            }

            return c.json({ error: "Internal Server Error" }, 500);
        }
    })
    .post("/register", zValidator("json", registerSchema), async (c) => {
        const { name, email, password } = c.req.valid("json");

        const { account } = await createAdminClient();
        await account.create(ID.unique(), email, password, name);

        const session = await account.createEmailPasswordSession(
            email,
            password,
        );

        setCookie(c, AUTH_COOKIE, session.secret, {
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: MAX_AGE_SESSION,
        });

        return c.json({ success: true });
    })
    .post("/logout", sessionMiddleware, async (c) => {
        const account = c.get("account");

        deleteCookie(c, AUTH_COOKIE);
        await account.deleteSession("current");

        return c.json({ success: true });
    });

export default app;
