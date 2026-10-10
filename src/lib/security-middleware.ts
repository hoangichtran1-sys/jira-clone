import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
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
                throw new HTTPException(429, { message: "Too many requests" });
            } else if (decision?.reason.isBot()) {
                throw new HTTPException(403, { message: "No bots allowed" });
            } else {
                throw new HTTPException(403, { message: "Forbidden" });
            }
        }
    } catch (error) {
        console.error("Arcjet middleware error", error);
        throw new HTTPException(503, { message: "Service Unavailable" });
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
                throw new HTTPException(429, {
                    message: "Too many requests",
                });
            } else if (decision.reason?.isBot()) {
                throw new HTTPException(403, { message: "No bots allowed" });
            } else {
                throw new HTTPException(403, { message: "Forbidden" });
            }
        }
    } catch (error) {
        console.error("Arcjet middleware error", error);
        throw new HTTPException(503, { message: "Service Unavailable" });
    }

    await next();
});
