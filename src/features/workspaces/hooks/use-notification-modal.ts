import { useAtomValue, useSetAtom } from "jotai";
import { notificationModalState } from "../atoms/notification-modal-state";

export const useNotificationModal = () => {
    const isNotificationStateModal = useAtomValue(notificationModalState);
    const setNotificationStateModal = useSetAtom(notificationModalState);

    const onOpen = () => setNotificationStateModal(true);
    const onClose = () => setNotificationStateModal(false);

    return {
        isNotificationStateModal,
        setNotificationStateModal,
        onOpen,
        onClose,
    };
};
