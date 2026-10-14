import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";
import { TaskStatus } from "../types";
import { ErrorResponse } from "@/types";

interface UseGetTasksProps {
    workspaceId: string;
    projectId?: string | null;
    status?: TaskStatus | null;
    search?: string | null;
    assigneeId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
}

export const useGetTasks = ({
    workspaceId,
    projectId,
    status,
    search,
    assigneeId,
    startDate,
    endDate,
}: UseGetTasksProps) => {
    const query = useQuery({
        queryKey: [
            "tasks",
            workspaceId,
            projectId,
            status,
            search,
            assigneeId,
            startDate,
            endDate,
        ],
        queryFn: async () => {
            const rawQuery = {
                projectId,
                status,
                search,
                assigneeId,
                startDate,
                endDate,
            };
            const cleanedQuery = Object.fromEntries(
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                Object.entries(rawQuery).filter(([_k, v]) => Boolean(v)),
            );
            const response = await client.api.tasks.$get({
                query: {
                    workspaceId,
                    ...cleanedQuery,
                },
            });

            if (!response.ok) {
                const errorResponse =
                    (await response.json()) as unknown as ErrorResponse;
                console.log(errorResponse);
                throw errorResponse;
            }

            const { data } = await response.json();

            return data;
        },
    });

    return query;
};
