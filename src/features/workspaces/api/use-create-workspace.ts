import { client } from "@/lib/rpc";
import { ErrorResponse } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ResponseType = InferResponseType<
    (typeof client.api.workspaces)["$post"],
    200
>;
type RequestType = InferRequestType<(typeof client.api.workspaces)["$post"]>;

export const useCreateWorkspace = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, ErrorResponse, RequestType>({
        mutationFn: async ({ form }) => {
            const response = await client.api.workspaces["$post"]({ form });

            if (!response.ok) {
                const errorResponse =
                    (await response.json()) as unknown as ErrorResponse;
                throw errorResponse;
            }

            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success("Workspace created");
            router.push(`/workspaces/${data.$id}`);
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            queryClient.invalidateQueries({
                queryKey: ["total-workspace-create"],
            });
        },
        onError: (err) => {
            toast.error(err.error);
        },
    });

    return mutation;
};
