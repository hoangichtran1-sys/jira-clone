"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { CreateProjectForm } from "./create-project-form";
import { useCreateProjectModal } from "../hooks/use-create-project-modal";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";
import { useGetTotalProjectInWorkspace } from "../api/use-get-total-project-in-workspace";

export const CreateProjectModal = () => {
    const workspaceId = useWorkspaceId();
    const { isOpen, setIsOpen, close } = useCreateProjectModal();
    const { shouldBlock } = usePaywall();
    const { data: totalProject } = useGetTotalProjectInWorkspace({
        workspaceId,
    });

    return (
        <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
            <CreateProjectForm
                shouldBlock={shouldBlock}
                totalProject={totalProject || 0}
                onCancel={close}
            />
        </ResponsiveModal>
    );
};
