import { InferResponseType } from "hono";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { ErrorResponse } from "@/types";
import { useParamsStates } from "@/hooks/use-params-state";

type ResponseType = InferResponseType<
    (typeof client.api.subscriptions.checkout)["$post"],
    200
>;

export const useCheckoutSubscription = () => {
    const pathname = usePathname();
    const [, setParamsState] = useParamsStates();

    const mutation = useMutation<ResponseType, ErrorResponse>({
        mutationFn: async () => {
            const response = await client.api.subscriptions.checkout.$post({
                query: { origin: pathname },
            });
            if (!response.ok) {
                const errorResponse =
                    (await response.json()) as unknown as ErrorResponse;
                throw errorResponse;
            }
            return await response.json();
        },
        onMutate: () => {
            setParamsState({ success: null });
        },
        onSuccess: ({ data: url }) => {
            toast.success("LemonSqueezy already start checkout.");
            window.location.href = url;
        },
        onError: (err) => {
            toast.error(err.error);
        },
    });
    return mutation;
};
