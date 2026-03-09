import { Hono } from "hono";
import { handle } from "hono/vercel";
//import { rateLimiter } from "hono-rate-limiter";
import auth from "@/features/auth/server/route";
import workspaces from "@/features/workspaces/server/route";
import members from "@/features/members/server/route";
import projects from "@/features/projects/server/route";
import tasks from "@/features/tasks/server/route";
import subscriptions from "@/features/subscriptions/server/route";
import ably from "./ably";
import bull from "./bull"
import { baseSecurityMiddleware } from "@/lib/security-middleware";

export const runtime = "nodejs";

const app = new Hono().basePath("/api");

// Rate limit
// app.use(
//     rateLimiter({
//         windowMs: 60 * 1000,
//         limit: 180,
//         keyGenerator: (c) =>
//             c.req.header("cf-connecting-ip") ??
//             c.req.header("x-forwarded-for")?.split(",")[0] ??
//             c.req.header("x-real-ip") ??
//             "unknown",
//         handler: (c) => {
//             return c.json(
//                 { error: "Too many requests", type: "rate_limit_exceeded" },
//                 429,
//             );
//         },
//     }),
// );

app.use("*", baseSecurityMiddleware);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
    .route("/auth", auth)
    .route("/workspaces", workspaces)
    .route("/members", members)
    .route("/projects", projects)
    .route("/tasks", tasks)
    .route("/subscriptions", subscriptions)
    .route("/admin/bull", bull)
    .route("/ably", ably);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const PUT = handle(app);

export type AppType = typeof routes;
