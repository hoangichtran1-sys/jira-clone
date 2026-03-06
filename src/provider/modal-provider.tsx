"use client";

import { SubscriptionModal } from "@/features/subscriptions/components/subscription-modal";
import { useMountedState } from "react-use";

export const ModalProvider = () => {
    const isMounted = useMountedState();

    if (!isMounted) {
        return null;
    }

    return (
        <>
            <SubscriptionModal />
        </>
    );
};
