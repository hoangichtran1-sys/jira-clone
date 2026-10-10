import { client } from "@/lib/rpc";
import { ErrorResponse } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ResponseType = InferResponseType<
    (typeof client.api.projects)[":projectId"]["$delete"],
    200
>;
type RequestType = InferRequestType<
    (typeof client.api.projects)[":projectId"]["$delete"]
>;

export const useDeleteProject = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, ErrorResponse, RequestType>({
        mutationFn: async ({ param }) => {
            const response = await client.api.projects[":projectId"]["$delete"](
                { param },
            );

            if (!response.ok) {
                const errorResponse =
                    (await response.json()) as unknown as ErrorResponse;
                throw errorResponse;
            }

            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success("Project deleted");
            router.push(`/workspaces/${data.workspaceId}`);
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({
                queryKey: ["total-project-in-workspace"],
            });
            queryClient.invalidateQueries({
                queryKey: ["project", data.$id],
            });
        },
        onError: (err) => {
            toast.error(err.error);
        },
    });

    return mutation;
};
