import { client } from "@/lib/rpc";
import { ErrorResponse } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
    (typeof client.api.projects)[":projectId"]["$patch"],
    200
>;
type RequestType = InferRequestType<
    (typeof client.api.projects)[":projectId"]["$patch"]
>;

export const useUpdateProject = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, ErrorResponse, RequestType>({
        mutationFn: async ({ param, form }) => {
            const response = await client.api.projects[":projectId"]["$patch"]({
                param,
                form,
            });

            if (!response.ok) {
                const errorResponse =
                    (await response.json()) as unknown as ErrorResponse;
                throw errorResponse;
            }

            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success("Project updated");
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["project", data.$id] });
        },
        onError: (err) => {
            toast.error(err.error);
        },
    });

    return mutation;
};
