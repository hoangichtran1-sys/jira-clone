import { InferResponseType } from "hono";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
    (typeof client.api.subscriptions.checkout)["$post"],
    200
>;

export const useCheckoutSubscription = () => {
    const mutation = useMutation<ResponseType, Error>({
        mutationFn: async () => {
            const response = await client.api.subscriptions.checkout.$post();
            if (!response.ok) {
                throw Error("Failed to create URL checkout");
            }
            return await response.json();
        },
        onSuccess: ({ data: url }) => {
            toast.success("LemonSqueezy already start checkout.");
            window.location.href = url;
        },
        onError: () => {
            toast.error("Failed to create plaid URL checkout");
        },
    });
    return mutation;
};
