"use client";

import { ChannelProvider } from "ably/react";

interface AblyChannelClientProviderProps {
    children: React.ReactNode;
    channelName: string;
}

export function AblyChannelClientProvider({
    children,
    channelName,
}: AblyChannelClientProviderProps) {
    return (
        <ChannelProvider channelName={channelName}>{children}</ChannelProvider>
    );
}
