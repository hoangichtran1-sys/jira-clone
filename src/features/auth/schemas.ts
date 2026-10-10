import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email(),
    password: z
        .string()
        .min(6, "Password too short!")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter"),
});

export const registerSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().email(),
    password: z
        .string()
        .min(6, "Password too short!")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter"),
});
