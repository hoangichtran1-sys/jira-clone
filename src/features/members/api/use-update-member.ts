import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { ErrorResponse } from "@/types";

type ResponseType = InferResponseType<
    (typeof client.api.members)[":memberId"]["$patch"],
    200
>;
type RequestType = InferRequestType<
    (typeof client.api.members)[":memberId"]["$patch"]
>;

export const useUpdateMember = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, ErrorResponse, RequestType>({
        mutationFn: async ({ param, query, json }) => {
            const response = await client.api.members[":memberId"]["$patch"]({
                param,
                query,
                json,
            });

            if (!response.ok) {
                const errorResponse =
                    (await response.json()) as unknown as ErrorResponse;
                throw errorResponse;
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Member updated");
            queryClient.invalidateQueries({
                queryKey: ["members"],
            });
        },
        onError: (err) => {
            toast.error(err.error);
        },
    });

    return mutation;
};
