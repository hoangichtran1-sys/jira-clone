import { Hono } from "hono";
import { handle } from "@hono/vercel";
import { logger } from "hono/logger";
import { methodNotAllowed } from "hono/method-not-allowed";
import { HTTPException } from "hono/http-exception";
import { timeout } from "hono/timeout";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { AppwriteException } from "node-appwrite";

import { baseSecurityMiddleware } from "@/lib/security-middleware";
import workspaces from "@/features/workspaces/server/route";
import members from "@/features/members/server/route";
import projects from "@/features/projects/server/route";
import tasks from "@/features/tasks/server/route";
import subscriptions from "@/features/subscriptions/server/route";
import auth from "./auth";
import ably from "./ably";
// import cron from "./cron";

const app = new Hono().basePath("/api");

app.use(logger());

app.use("/api", baseSecurityMiddleware);

app.use(
    "/api",
    timeout(
        60000,
        new HTTPException(408, {
            message: "Operation timed out. Please try again later",
        }),
    ),
);

app.use(
    "/api",
    methodNotAllowed({
        app,
        onMethodNotAllowed: (_c, methods) => {
            throw new HTTPException(405, {
                message: "Method Not Allowed",
                cause: `Allow: ${methods.join(", ")},`,
            });
        },
    }),
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
    .route("/auth", auth)
    .route("/workspaces", workspaces)
    .route("/members", members)
    .route("/projects", projects)
    .route("/tasks", tasks)
    .route("/subscriptions", subscriptions)
    .route("/ably", ably);
// .route("/trigger", cron);

app.notFound((c) => {
    return c.json(
        { error: `Route ${c.req.method} ${c.req.url} not found` },
        404,
    );
});

app.onError((err, c) => {
    if (err instanceof AppwriteException) {
        return c.json(
            { error: err.message, cause: err.cause },
            err.code as ContentfulStatusCode,
        );
    }

    if (err instanceof HTTPException) {
        return c.json({ error: err.message, cause: err.cause }, err.status);
    }

    return c.json({ error: "Something went wrong" }, 500);
});

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const PUT = handle(app);

export type AppType = typeof routes;
