import { useAtomValue, useSetAtom } from "jotai";
import { invitationModalState } from "../atoms/invitation-modal-state";

export const useInvitationModal = () => {
    const isInvitationStateModal = useAtomValue(invitationModalState);
    const setInvitationStateModal = useSetAtom(invitationModalState);

    const onOpen = () => setInvitationStateModal(true);
    const onClose = () => setInvitationStateModal(false);

    return {
        isInvitationStateModal,
        setInvitationStateModal,
        onOpen,
        onClose,
    };
};
