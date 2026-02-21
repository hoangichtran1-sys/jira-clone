import { client } from "@/lib/rpc";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
    (typeof client.api.workspaces)["send-email-invitation"]["$post"],
    200
>;
type RequestType = InferRequestType<(typeof client.api.workspaces)["send-email-invitation"]["$post"]>;

export const useSendEmailInvitation = () => {
    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ query, json }) => {
            const response = await client.api.workspaces["send-email-invitation"]["$post"]({ query, json });

            if (!response.ok) {
                throw new Error("Failed to send email");
            }

            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success("Send email successfully");
            console.log(data)
        },
        onError: () => {
            toast.error("Failed to send email");
        },
    });

    return mutation;
};
