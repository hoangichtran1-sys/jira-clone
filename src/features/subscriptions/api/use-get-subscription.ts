import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetSubscription = () => {
    const query = useQuery({
        queryKey: ["subscription"],
        queryFn: async () => {
            const response =
                await client.api.subscriptions["current-subscription"].$get();
            if (!response.ok) {
                return null;
            }
            const { data } = await response.json();
            return data;
        },
    });

    return query;
};
