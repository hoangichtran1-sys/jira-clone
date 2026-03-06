"use client";

import { userIdAtom } from "@/features/auth/atoms/user-id-atom";
import { useQueryClient } from "@tanstack/react-query";
import { usePresence, useChannel } from "ably/react";
import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

interface NotificationProviderProps {
    workspaceId: string;
}

export const NotificationProvider = ({
    workspaceId,
}: NotificationProviderProps) => {
    const userId = useAtomValue(userIdAtom);

    if (!userId || !workspaceId) {
        return null;
    }

    return (
        <>
            <PresenceInner workspaceId={workspaceId} userId={userId} />
            <ChannelInner userId={userId} workspaceId={workspaceId} />
        </>
    );
};

interface PresenceInnerProps {
    workspaceId: string;
    userId: string;
}

const PresenceInner = ({ workspaceId, userId }: PresenceInnerProps) => {
    const { updateStatus } = usePresence(
        `notification:workspace:${workspaceId}`,
        userId,
    );

    useEffect(() => {
        updateStatus(userId);
    }, [updateStatus, userId]);

    return null;
};

interface ChannelInnerProps {
    workspaceId: string;
    userId: string;
}

const ChannelInner = ({ workspaceId, userId }: ChannelInnerProps) => {
    const queryClient = useQueryClient();
    const router = useRouter();

    useChannel(
        `notification:workspace:${workspaceId}`,
        "member-join-workspace",
        (msg) => {
            if (msg.data.userId !== userId) {
                toast.info(msg.data.message, { position: "top-center" });
            }
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            queryClient.invalidateQueries({
                queryKey: ["workspace", msg.data.workspaceId],
            });
        },
    );

    useChannel(
        `notification:workspace:${workspaceId}`,
        "delete-workspace",
        (msg) => {
            if (msg.data.userId !== userId) {
                toast.info(msg.data.message, { position: "top-center" });
            }
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            queryClient.invalidateQueries({
                queryKey: ["total-workspace-create"],
            });
            // queryClient.invalidateQueries({
            //     queryKey: ["workspace", msg.data.workspaceId],
            // });
            router.push("/");
        },
    );

    useChannel(
        `notification:workspace:${workspaceId}`,
        "remove-member",
        (msg) => {
            if (msg.data.userId !== userId) {
                toast.info(msg.data.message, { position: "top-center" });
            }
            queryClient.invalidateQueries({
                queryKey: ["members"],
            });
            router.push("/");
        },
    );

    useChannel(
        `notification:workspace:${workspaceId}`,
        "create-task",
        (msg) => {
            if (msg.data.userId !== userId) {
                toast.info(msg.data.message, { position: "top-center" });
            }
            queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
            queryClient.invalidateQueries({
                queryKey: ["workspace-analytics"],
            });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    );

    useChannel(
        `notification:workspace:${workspaceId}`,
        "delete-task",
        (msg) => {
            if (msg.data.userId !== userId) {
                toast.info(msg.data.message, { position: "top-center" });
            }
            queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
            queryClient.invalidateQueries({
                queryKey: ["workspace-analytics"],
            });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({
                queryKey: ["task", msg.data.task],
            });
        },
    );

    useChannel(
        `notification:workspace:${workspaceId}`,
        "create-project",
        (msg) => {
            if (msg.data.userId !== userId) {
                toast.info(msg.data.message, { position: "top-center" });
            }
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({
                queryKey: ["total-project-in-workspace"],
            });
        },
    );

    useChannel(
        `notification:workspace:${workspaceId}`,
        "delete-project",
        (msg) => {
            if (msg.data.userId !== userId) {
                toast.info(msg.data.message, { position: "top-center" });
            }
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({
                queryKey: ["total-project-in-workspace"],
            });
            queryClient.invalidateQueries({
                queryKey: ["project", msg.data.project],
            });
        },
    );

    useChannel(
        `sms:workspace:${workspaceId}`,
        `send-message-to-member-${userId}`,
        (msg) => {
            if (userId !== msg.data.receiverId) {
                console.warn(msg.data.receiverId);
                return;
            }
            toast.info(msg.data.title, {
                description: `${msg.data.content} by user ${msg.data.senderId}`,
                position: "top-right",
            });
        },
    );

    return null;
};
