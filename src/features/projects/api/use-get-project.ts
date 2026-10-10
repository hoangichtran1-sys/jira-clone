import { client } from "@/lib/rpc";
import { ErrorResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface UseGetProjectProps {
    projectId: string;
}

export const useGetProject = ({ projectId }: UseGetProjectProps) => {
    const query = useQuery({
        queryKey: ["project", projectId],
        queryFn: async () => {
            const response = await client.api.projects[":projectId"].$get({
                param: { projectId },
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
