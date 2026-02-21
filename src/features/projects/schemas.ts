import { z } from "zod";

export const createProjectSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    image: z
        .union([
            z.instanceof(File),
            z.string().transform((value) => (value === "" ? undefined : value)),
        ])
        .optional(),
    workspaceId: z.string(),
});

export const createProjectFormSchema = createProjectSchema.omit({
    workspaceId: true,
});

export const updateProjectSchema = z.object({
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
