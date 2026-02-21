import { useGetSubscription } from "../api/use-get-subscription";
import { useSubscriptionModal } from "./use-subscription-modal";

export const usePaywall = () => {
    const { data: subscription, isLoading: isLoadingSubscription } =
        useGetSubscription();

    const { onOpen } = useSubscriptionModal();

    const shouldBlock = !subscription || subscription.status === "expired";

    return {
        isLoadingSubscription,
        shouldBlock,
        triggerPaywall: () => {
            onOpen();
        },
    };
};
