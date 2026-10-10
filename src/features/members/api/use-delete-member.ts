import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { ErrorResponse } from "@/types";

type ResponseType = InferResponseType<
    (typeof client.api.members)[":memberId"]["$delete"],
    200
>;
type RequestType = InferRequestType<
    (typeof client.api.members)[":memberId"]["$delete"]
>;

export const useDeleteMember = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, ErrorResponse, RequestType>({
        mutationFn: async ({ param, query }) => {
            const response = await client.api.members[":memberId"]["$delete"]({
                param,
                query,
            });

            if (!response.ok) {
                const errorResponse =
                    (await response.json()) as unknown as ErrorResponse;
                throw errorResponse;
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Member deleted");
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
