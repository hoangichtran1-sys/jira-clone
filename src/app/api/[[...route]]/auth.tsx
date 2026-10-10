import { Hono } from "hono";
import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import { ID, Query } from "node-appwrite";
import { addMinutes } from "date-fns";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { render } from "@react-email/render";
import { sessionMiddleware } from "@/lib/session-middleware";
import { zodValidator } from "@/lib/zod-validator";
import { HTTPException } from "hono/http-exception";
import { redis } from "@/lib/redis";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/appwrite";
import type {
    sendEmailVetification,
    sendEmailForgotPassword,
} from "@/trigger/send-mail-tasks";
import { authSecurityMiddleware } from "@/lib/security-middleware";
import { VerificationLinkEmail } from "@/components/verification-link";
import { PasswordResetEmail } from "@/components/password-reset";

function generateOTP(length: number = 6) {
    const random: RandomReader = {
        read(bytes) {
            crypto.getRandomValues(bytes);
        },
    };

    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, length);
}

async function verifyToken(key: string, token: string) {
    const raw = await redis.get(key);

    if (!raw) {
        return false;
    }

    const data = JSON.parse(raw) as {
        token: string;
    };

    if (token !== data.token) {
        return false;
    }

    return true;
}

const app = new Hono()
    .post(
        "/send-verification-link",
        authSecurityMiddleware,
        zodValidator(
            "query",
            z.object({ origin: z.string().min(1).optional() }),
        ),
        sessionMiddleware,
        async (c) => {
            const { origin } = c.req.valid("query") || "/";
            const user = c.get("user");

            if (user.emailVerification) {
                throw new HTTPException(400, {
                    message: "Email verified",
                });
            }

            const existingData = await redis.get(
                `user:${user.$id}:verify_email`,
            );

            if (existingData) {
                throw new HTTPException(400, {
                    message: "Please try again in 10 minutes",
                });
            }

            const verifySecret = ID.unique();
            await redis.set(
                `user:${user.$id}:verify_email`,
                JSON.stringify({
                    token: verifySecret,
                }),
                "EX",
                10 * 60,
            );

            const verificationUrl = `${env.APP_URL}/api/auth/verify-email?userId=${user.$id}&secret=${verifySecret}&redirectTo=${origin}`;

            const react = await render(
                <VerificationLinkEmail
                    link={verificationUrl}
                    expires={addMinutes(new Date(), 10)}
                />,
            );

            const handle = await tasks.trigger<typeof sendEmailVetification>(
                "send-email-verification",
                {
                    email: user.email,
                    subject: "Verify Your Email",
                    html: react,
                },
            );

            console.log(handle);

            return c.json({ message: "Send verification link successfully" });
        },
    )
    .post(
        "/send-opt-forgot-password",
        authSecurityMiddleware,
        zodValidator("json", z.object({ email: z.string().email() })),
        async (c) => {
            const { email } = c.req.valid("json");
            const { users } = await createAdminClient();

            const results = await users.list({
                queries: [Query.equal("email", email)],
            });

            const user = results.total > 0 ? results.users[0] : null;

            if (!user) {
                throw new HTTPException(404, { message: "User not found" });
            }

            const existingData = await redis.get(
                `user:${user.$id}:forgot_password`,
            );

            if (existingData) {
                throw new HTTPException(400, {
                    message: "Please try again in 5 minutes",
                });
            }

            const OTPCode = generateOTP();

            await redis.set(
                `user:${user.$id}:forgot_password`,
                JSON.stringify({
                    token: OTPCode,
                }),
                "EX",
                5 * 60,
            );

            const react = await render(
                <PasswordResetEmail
                    code={OTPCode}
                    expires={addMinutes(new Date(), 5)}
                />,
            );

            const handle = await tasks.trigger<typeof sendEmailForgotPassword>(
                "send-email-forgot-password",
                {
                    email: user.email,
                    subject: "Forgot-password",
                    html: react,
                },
            );

            console.log(handle);

            return c.json({ message: "Send opt successfully" });
        },
    )
    .post(
        "/verify-otp",
        zodValidator(
            "json",
            z.object({
                email: z.string().email(),
                otp: z.number().int().min(100000).max(999999),
            }),
        ),
        async (c) => {
            const { email, otp } = c.req.valid("json");
            const { users } = await createAdminClient();

            const results = await users.list({
                queries: [Query.equal("email", email)],
            });

            const user = results.total > 0 ? results.users[0] : null;

            if (!user) {
                throw new HTTPException(404, { message: "User not found" });
            }

            const isVerify = await verifyToken(
                `user:${user.$id}:forgot_password`,
                otp.toString(),
            );

            if (!isVerify) {
                throw new HTTPException(400, {
                    message: "Failed to verify OTP",
                });
            }

            await redis.del(`user:${user.$id}:forgot_password`);

            return c.json({ message: "OTP vefification successfully" });
        },
    )
    .post(
        "/resend-otp",
        zodValidator(
            "json",
            z.object({
                email: z.string().email(),
            }),
        ),
        async (c) => {
            const { email } = c.req.valid("json");

            const { users } = await createAdminClient();

            const results = await users.list({
                queries: [Query.equal("email", email)],
            });

            const user = results.total > 0 ? results.users[0] : null;

            if (!user) {
                throw new HTTPException(404, { message: "User not found" });
            }

            const existingData = await redis.get(
                `user:${user.$id}:forgot_password`,
            );

            if (existingData) {
                throw new HTTPException(400, {
                    message: "Please try again in 5 minutes",
                });
            }

            const OTPCode = generateOTP();

            await redis.set(
                `user:${user.$id}:forgot_password`,
                JSON.stringify({
                    token: OTPCode,
                }),
                "EX",
                5 * 60,
            );

            const react = await render(
                <PasswordResetEmail
                    code={OTPCode}
                    expires={addMinutes(new Date(), 5)}
                />,
            );

            const handle = await tasks.trigger<typeof sendEmailForgotPassword>(
                "send-email-forgot-password",
                {
                    email,
                    subject: "Resend OTP",
                    html: react,
                },
            );

            console.log(handle);

            return c.json({ message: "Resend opt successfully" });
        },
    )
    .post(
        "/reset-password",
        zodValidator(
            "json",
            z.object({
                email: z.string().email(),
                newPassword: z
                    .string()
                    .min(6, "Password too short!")
                    .regex(
                        /[A-Z]/,
                        "Password must contain at least one uppercase letter",
                    )
                    .regex(
                        /[a-z]/,
                        "Password must contain at least one lowercase letter",
                    ),
            }),
        ),
        async (c) => {
            const { email, newPassword } = c.req.valid("json");
            const { users } = await createAdminClient();

            const results = await users.list({
                queries: [Query.equal("email", email)],
            });

            const user = results.total > 0 ? results.users[0] : null;

            if (!user) {
                throw new HTTPException(404, { message: "User not found" });
            }

            await users.updatePassword({
                userId: user.$id,
                password: newPassword,
            });

            return c.json({ message: "Reset password successfully" });
        },
    )
    .get(
        "/verify-email",
        zodValidator(
            "query",
            z.object({
                userId: z.string().min(1),
                secret: z.string().min(1),
                redirectTo: z.string().min(1),
            }),
        ),
        async (c) => {
            const { userId, secret, redirectTo } = c.req.valid("query");
            const { users } = await createAdminClient();

            const isVerify = await verifyToken(
                `user:${userId}:verify_email`,
                secret,
            );

            if (isVerify) {
                await users.updateEmailVerification({
                    userId,
                    emailVerification: true,
                });

                await redis.del(`user:${userId}:verify_email`);
            }

            const redirectUrl = `${env.APP_URL}${redirectTo}?isVerify=${isVerify}`;

            return c.redirect(redirectUrl);
        },
    );

export default app;
