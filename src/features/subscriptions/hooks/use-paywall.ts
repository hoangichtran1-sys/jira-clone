import { SubscriptionStatus } from "@/types";
import { useGetSubscription } from "../api/use-get-subscription";
import { useSubscriptionModal } from "./use-subscription-modal";

export const usePaywall = () => {
    const {
        data: subscription,
        isLoading: isLoadingSubscription,
        isError: isErrorSubscription,
        error: errorSubscription,
    } = useGetSubscription();

    const { onOpen } = useSubscriptionModal();

    const shouldBlock =
        !subscription ||
        (subscription.status as SubscriptionStatus) === "expired" ||
        (subscription.status as SubscriptionStatus) === "paused";

    return {
        isLoadingSubscription,
        isErrorSubscription,
        errorSubscription,
        shouldBlock,
        triggerPaywall: () => {
            onOpen();
        },
    };
};
