"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { useNotificationModal } from "../hooks/use-notification-modal";
import { NotificationWorkspaceFormWrapper } from "./notification-workspace-form-wrapper";

export const NotificationWorkspaceModal = () => {
    const { isNotificationStateModal, setNotificationStateModal, onClose } = useNotificationModal();

    return (
        <ResponsiveModal open={isNotificationStateModal} onOpenChange={setNotificationStateModal}>
            <NotificationWorkspaceFormWrapper onCancel={onClose} />
        </ResponsiveModal>
    );
};
