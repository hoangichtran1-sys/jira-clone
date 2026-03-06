import { z } from "zod";

export const createWorkspaceSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    image: z
        .union([
            z.instanceof(File),
            z.string().transform((value) => (value === "" ? undefined : value)),
        ])
        .optional(),
});

export const updateWorkspaceSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Name is must be 1 or more characters")
        .optional(),
    image: z
        .union([
            z.instanceof(File),
            z.string().transform((value) => (value === "" ? undefined : value)),
        ])
        .optional(),
});

export const invitationSchema = z.object({
    emailTo: z.string().trim().email(),
});

export const notificationSchema = z.object({
    receiverId: z.string().min(1, "Receiver ID is required"),
    title: z.string().trim().min(1, "Title is required"),
    content: z.string().trim().min(1, "Content is required"),
});
