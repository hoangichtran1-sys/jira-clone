import { client } from "@/lib/rpc";
import { ErrorResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface UseGetMembersProps {
    workspaceId: string;
}

export const useGetMembers = ({ workspaceId }: UseGetMembersProps) => {
    const query = useQuery({
        queryKey: ["members", workspaceId],
        enabled: !!workspaceId,
        queryFn: async () => {
            const response = await client.api.members.$get({
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
        refetchInterval: 60000,
        refetchOnWindowFocus: true,
    });

    return query;
};
