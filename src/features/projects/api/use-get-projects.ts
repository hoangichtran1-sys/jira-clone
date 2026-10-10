import { client } from "@/lib/rpc";
import { ErrorResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface UseGetProjectsProps {
    workspaceId: string;
}

export const useGetProjects = ({ workspaceId }: UseGetProjectsProps) => {
    const query = useQuery({
        queryKey: ["projects", workspaceId],
        enabled: !!workspaceId,
        queryFn: async () => {
            const response = await client.api.projects.$get({
                query: { workspaceId },
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
