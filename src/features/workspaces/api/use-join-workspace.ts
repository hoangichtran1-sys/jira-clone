import { client } from "@/lib/rpc";
import { ErrorResponse } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
    (typeof client.api.workspaces)[":workspaceId"]["join"]["$post"],
    200
>;
type RequestType = InferRequestType<
    (typeof client.api.workspaces)[":workspaceId"]["join"]["$post"]
>;

export const useJoinWorkspace = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, ErrorResponse, RequestType>({
        mutationFn: async ({ param, json }) => {
            const response = await client.api.workspaces[":workspaceId"][
                "join"
            ]["$post"]({ param, json });

            if (!response.ok) {
                const errorResponse =
                    (await response.json()) as unknown as ErrorResponse;
                throw errorResponse;
            }

            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success("Joined workspace");
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            queryClient.invalidateQueries({
                queryKey: ["workspace", data.$id],
            });
        },
        onError: (err) => {
            toast.error(err.error);
        },
    });

    return mutation;
};
