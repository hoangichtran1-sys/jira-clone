import { client } from "@/lib/rpc";
import { ErrorResponse } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
    (typeof client.api.tasks)["bulk-update"]["$post"],
    200
>;
type RequestType = InferRequestType<
    (typeof client.api.tasks)["bulk-update"]["$post"]
>;

export const useBulkUpdateTasks = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, ErrorResponse, RequestType>({
        mutationFn: async ({ json }) => {
            const response = await client.api.tasks["bulk-update"]["$post"]({
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
            toast.success("Tasks updated");
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
