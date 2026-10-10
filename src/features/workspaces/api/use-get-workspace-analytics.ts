import { client } from "@/lib/rpc";
import { ErrorResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { InferResponseType } from "hono";

interface UseGetWorkspaceAnalyticsProps {
    workspaceId: string;
}

export type WorkspaceAnalyticsResponseType = InferResponseType<
    (typeof client.api.workspaces)[":workspaceId"]["analytics"]["$get"]
>;

export const useGetWorkspaceAnalytics = ({
    workspaceId,
}: UseGetWorkspaceAnalyticsProps) => {
    const query = useQuery({
        queryKey: ["workspace-analytics", workspaceId],
        queryFn: async () => {
            const response = await client.api.workspaces[":workspaceId"][
                "analytics"
            ].$get({
                param: { workspaceId },
            });

            if (!response.ok) {
                const errorResponse =
                    (await response.json()) as unknown as ErrorResponse;
                throw errorResponse;
            }

            const { data } = await response.json();

            return data;
        },
    });

    return query;
};
