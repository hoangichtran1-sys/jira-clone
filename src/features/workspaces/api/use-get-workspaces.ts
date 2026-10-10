import { client } from "@/lib/rpc";
import { ErrorResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const useGetWorkspaces = () => {
    const query = useQuery({
        queryKey: ["workspaces"],
        queryFn: async () => {
            const response = await client.api.workspaces.$get();

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
