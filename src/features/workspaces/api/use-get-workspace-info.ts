import { client } from "@/lib/rpc";
import { ErrorResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface UseGetWorkspaceProps {
    workspaceId: string;
}

export const useGetWorkspaceInfo = ({ workspaceId }: UseGetWorkspaceProps) => {
    const query = useQuery({
        queryKey: ["workspace", workspaceId],
        queryFn: async () => {
            const response = await client.api.workspaces[":workspaceId"][
                "info"
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
