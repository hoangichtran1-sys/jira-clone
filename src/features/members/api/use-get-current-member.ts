import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";

interface UseGetCurrentMemberProps {
    workspaceId: string;
}

export const useGetCurrentMember = ({
    workspaceId,
}: UseGetCurrentMemberProps) => {
    const query = useQuery({
        queryKey: ["member", workspaceId],
        enabled: !!workspaceId,
        queryFn: async () => {
            const response = await client.api.members["current-member"].$get({
                query: { workspaceId },
            });

            if (!response.ok) {
                return null;
            }

            const { data } = await response.json();

            return data;
        },
        refetchInterval: 60000,
        refetchOnWindowFocus: true,
    });

    return query;
};
