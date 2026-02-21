"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { useInvitationModal } from "../hooks/use-invitation-modal";
import { InvitationWorkspaceForm } from "./invitation-workspace-form";
import { useWorkspaceId } from "../hooks/use-workspace-id";

interface InvitationWorkspaceModalProps {
    fullInviteLink: string;
}

export const InvitationWorkspaceModal = ({ fullInviteLink }: InvitationWorkspaceModalProps) => {
    const workspaceId = useWorkspaceId()
    const { isInvitationStateModal, setInvitationStateModal, onClose } = useInvitationModal();

    return (
        <ResponsiveModal open={isInvitationStateModal} onOpenChange={setInvitationStateModal}>
            <InvitationWorkspaceForm
                onCancel={onClose}
                link={fullInviteLink}
                workspaceId={workspaceId}
            />
        </ResponsiveModal>
    );
};
