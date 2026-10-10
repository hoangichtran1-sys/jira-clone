import { useQueryStates, parseAsBoolean } from "nuqs";

export const useParamsStates = () => {
    return useQueryStates({
        success: parseAsBoolean.withOptions({
            clearOnDefault: true,
        }),
        isVerify: parseAsBoolean.withOptions({
            clearOnDefault: true,
        }),
    });
};
