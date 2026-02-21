"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { CreateWorkspaceForm } from "./create-workspace-form";
import { useCreateWorkspaceModal } from "../hooks/use-create-workspace-modal";
import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";
import { useGetTotalWorkspaceCreate } from "../api/use-get-total-workspace-create";

export const CreateWorkspaceModal = () => {
    const { isOpen, setIsOpen, close } = useCreateWorkspaceModal();
    const { shouldBlock } = usePaywall();
    const { data: totalWorkspace } = useGetTotalWorkspaceCreate();

    return (
        <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
            <CreateWorkspaceForm
                shouldBlock={shouldBlock}
                totalWorkspace={totalWorkspace || 0}
                onCancel={close}
            />
        </ResponsiveModal>
    );
};
