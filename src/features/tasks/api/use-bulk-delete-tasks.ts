import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
    (typeof client.api.tasks)["bulk-delete"]["$post"],
    200
>;
type RequestType = InferRequestType<
    (typeof client.api.tasks)["bulk-delete"]["$post"]
>;

export const useBulkDeleteTasks = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ json }) => {
            const response = await client.api.tasks["bulk-delete"]["$post"]({
                json,
            });

            if (!response.ok) {
                throw new Error("Failed to bulk delete tasks");
            }

            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success(`${data.length} tasks deleted`);
            queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
            queryClient.invalidateQueries({
                queryKey: ["workspace-analytics"],
            });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
        onError: () => {
            toast.error("Failed to bulk delete tasks");
        },
    });

    return mutation;
};
