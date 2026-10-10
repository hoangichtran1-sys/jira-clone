import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { AdditionalContext } from "./session-middleware";
import { env } from "./env";

export const adminMiddleware = createMiddleware<AdditionalContext>(
    async (c, next) => {
        const user = c.get("user");
        const adminEmail = env.ADMIN_EMAIL;

        if (user.email !== adminEmail) {
            throw new HTTPException(403, { message: "Forbidden" });
        }

        await next();
    },
);
