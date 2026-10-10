import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import type { ZodType } from "zod";
import type { ValidationTargets } from "hono";

export const zodValidator = <
    T extends ZodType,
    Target extends keyof ValidationTargets,
>(
    target: Target,
    schema: T,
) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return zValidator(target, schema, (result, _c) => {
        if (!result.success) {
            throw new HTTPException(400, {
                message: "Validation failed",
                cause: result.error.issues.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
        }
    });
};
