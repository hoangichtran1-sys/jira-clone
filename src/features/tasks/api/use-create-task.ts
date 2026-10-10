import { client } from "@/lib/rpc";
import { ErrorResponse } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ResponseType = InferResponseType<(typeof client.api.tasks)["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api.tasks)["$post"]>;

export const useCreateTask = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, ErrorResponse, RequestType>({
        mutationFn: async ({ json }) => {
            const response = await client.api.tasks["$post"]({ json });

            if (!response.ok) {
                const errorResponse =
                    (await response.json()) as unknown as ErrorResponse;
                throw errorResponse;
            }

            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success("Task created");
            router.push(`/workspaces/${data.workspaceId}/tasks/${data.$id}`);
            queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
            queryClient.invalidateQueries({
                queryKey: ["workspace-analytics"],
            });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
        onError: (err) => {
            toast.error(err.error);
        },
    });

    return mutation;
};
