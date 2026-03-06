import { createMiddleware } from "hono/factory";
import { authArcjet, baseArcjet } from "./arcjet";

function isExcluded(path: string) {
  if (path.startsWith("/api/ably/")) return true;

  return [
    "/api/subscriptions/webhook",
    "/api/auth/login",
    "/api/auth/register",
  ].includes(path);
}

export const authSecurityMiddleware = createMiddleware(async (c, next) => {
    if (!authArcjet) return next();

    try {
        const decision = await authArcjet.protect(c.req.raw, { requested: 5 }); // Deduct 5 tokens from the bucket

        if (decision.isDenied()) {
            if (decision.reason?.isRateLimit()) {
                return c.json({ error: "Too many requests" }, 429);
            } else if (decision?.reason.isBot()) {
                return c.json({ error: "No bots allowed" }, 403);
            } else {
                return c.json({ error: "Forbidden" }, 403);
            }
        }
    } catch (error) {
        console.error("Arcjet middleware error", error);
        return c.json({ error: "Service Unavailable" }, 503);
    }

    await next();
});

export const baseSecurityMiddleware = createMiddleware(async (c, next) => {
    if (isExcluded(c.req.path)) {
        return next();
    }
    
    if (!baseArcjet) return next();

    try {
        const decision = await baseArcjet.protect(c.req.raw);

        if (decision.isDenied()) {
            if (decision.reason?.isRateLimit()) {
                return c.json({ error: "Too many requests" }, 429);
            } else if (decision.reason?.isBot()) {
                return c.json({ error: "No bots allowed" }, 403);
            } else {
                return c.json({ error: "Forbidden" }, 403);
            }
        }
    } catch (error) {
        console.error("Arcjet middleware error", error);
        return c.json({ error: "Service Unavailable" }, 503);
    }

    await next();
});
