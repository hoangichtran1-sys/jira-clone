import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";

export const useGetTotalWorkspaceCreate = () => {
    const query = useQuery({
        queryKey: ["total-workspace-create"],
        queryFn: async () => {
            const response =
                await client.api.workspaces["total-workspace-create"].$get();

            if (!response.ok) {
                return null;
            }

            const { data } = await response.json();

            return data;
        },
    });

    return query;
};
