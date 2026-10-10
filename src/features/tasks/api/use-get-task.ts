import { client } from "@/lib/rpc";
import { ErrorResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface UseGetTaskProps {
    taskId: string;
}

export const useGetTask = ({ taskId }: UseGetTaskProps) => {
    const query = useQuery({
        queryKey: ["task", taskId],
        queryFn: async () => {
            const response = await client.api.tasks[":taskId"].$get({
                param: {
                    taskId,
                },
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
