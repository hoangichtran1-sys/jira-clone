import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";

interface UseGetTotalProjectInWorkspaceProps {
    workspaceId: string;
}

export const useGetTotalProjectInWorkspace = ({
    workspaceId,
}: UseGetTotalProjectInWorkspaceProps) => {
    const query = useQuery({
        queryKey: ["total-project-in-workspace", workspaceId],
        enabled: !!workspaceId,
        queryFn: async () => {
            const response = await client.api.projects[
                "total-project-in-workspace"
            ].$get({
                query: { workspaceId },
            });

            if (!response.ok) {
                return null;
            }

            const { data } = await response.json();

            return data;
        },
    });

    return query;
};
