import { useAtomValue, useSetAtom } from "jotai";
import { subscriptionModalState } from "../atoms/subscription-modal-state";

export const useSubscriptionModal = () => {
    const isSubscriptionStateModal = useAtomValue(subscriptionModalState);
    const setSubscriptionStateModal = useSetAtom(subscriptionModalState);

    const onOpen = () => setSubscriptionStateModal(true);
    const onClose = () => setSubscriptionStateModal(false);

    return {
        isSubscriptionStateModal,
        setSubscriptionStateModal,
        onOpen,
        onClose,
    };
};
