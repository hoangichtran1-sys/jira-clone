import { createMiddleware } from "hono/factory";
import "server-only";
import { AdditionalContext } from "./session-middleware";

export const adminMiddleware = createMiddleware<AdditionalContext>(
    async (c, next) => {
        const user = c.get("user");
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!user) {
            return c.json({ error: "Not found"}, 404);
        }
        
        if (user.email !== adminEmail) {
            return c.json({ error: "Forbidden"}, 403)
        }

        await next();
    },
);
