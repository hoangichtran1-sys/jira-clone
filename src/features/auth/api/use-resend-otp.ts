import { client } from "@/lib/rpc";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import type { ErrorResponse } from "@/types";

type ResponseType = InferResponseType<
    (typeof client.api.auth)["resend-otp"]["$post"],
    200
>;
type RequestType = InferRequestType<
    (typeof client.api.auth)["resend-otp"]["$post"]
>;

export const useResendOTP = () => {
    const mutation = useMutation<ResponseType, ErrorResponse, RequestType>({
        mutationFn: async ({ json }) => {
            const response = await client.api.auth["resend-otp"]["$post"]({
                json,
            });

            if (!response.ok) {
                const errorResponse =
                    (await response.json()) as unknown as ErrorResponse;
                throw errorResponse;
            }

            return await response.json();
        },
        onSuccess: (data) => {
            toast.success(data.message);
        },
        onError: (err) => {
            toast.error(err.error);
        },
    });

    return mutation;
};
