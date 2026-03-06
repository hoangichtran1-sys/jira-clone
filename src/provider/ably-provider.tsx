/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { AblyProvider } from "ably/react";
import * as Ably from "ably";
import { client as rpc } from "@/lib/rpc";
import { useMemo, useRef } from "react";

interface AblyAuthClientProviderProps {
    children: React.ReactNode;
}

export function AblyAuthClientProvider({
    children,
}: AblyAuthClientProviderProps) {
    const client = useMemo(() => {
        return new Ably.Realtime({
            authCallback: async (_tokenParams, callback) => {
                try {
                    const res = await rpc.api.ably["auth"].$get();

                    if (!res.ok) {
                        throw new Error(" Failed to get ably token");
                    }

                    const { data } = await res.json();
                    callback(null, data);
                } catch (error) {
                    callback(error as any, null);
                }
            },
        });
    }, []);

    return <AblyProvider client={client}>{children}</AblyProvider>;
}

interface AblyWorkspaceClientProviderProps {
    children: React.ReactNode;
    workspaceId: string;
}

export function AblyWorkspaceClientProvider({
    children,
    workspaceId,
}: AblyWorkspaceClientProviderProps) {
    const clientRef = useRef<Ably.Realtime | null>(null);

    const client = useMemo(() => {
        if (!workspaceId) return null;

        if (!clientRef.current) {
            clientRef.current = new Ably.Realtime({
                authCallback: async (_tokenParams, callback) => {
                    try {
                        const res = await rpc.api.ably["workspace"].$get({
                            query: { workspaceId },
                        });

                        if (!res.ok) {
                            throw new Error(" Failed to get ably token");
                        }

                        const { data } = await res.json();
                        callback(null, data);
                    } catch (error) {
                        callback(error as any, null);
                    }
                },
                autoConnect: true,
                disconnectedRetryTimeout: 10000,
            });
        }

        return clientRef.current;
    }, [workspaceId]);

    if (!client) return <>{children}</>;

    return <AblyProvider client={client}>{children}</AblyProvider>;
}
