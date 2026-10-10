"use client";

import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Avatar,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupCount,
    AvatarImage,
} from "@/components/ui/avatar";
import Link from "next/link";
import { useJoinWorkspace } from "../api/use-join-workspace";
import { useWorkspaceId } from "../hooks/use-workspace-id";
import { useRouter } from "next/navigation";
import { WorkspaceAvatar } from "./workspace-avatar";
import { MemberPopulated } from "@/features/members/types";
import { useMemo } from "react";
import { getUserPhoto } from "@/lib/utils";

interface JoinWorkspaceFormProps {
    name: string;
    inviteCode: string;
    imageUrl?: string;
    membersInfo: Array<
        Pick<MemberPopulated, "role" | "userId" | "name" | "email">
    >;
}

export const JoinWorkspaceForm = ({
    name,
    inviteCode,
    imageUrl,
    membersInfo,
}: JoinWorkspaceFormProps) => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();
    const joinWorkspace = useJoinWorkspace();

    const onSubmit = () => {
        joinWorkspace.mutate(
            {
                param: { workspaceId },
                json: { code: inviteCode },
            },
            {
                onSuccess: ({ data }) => {
                    router.push(`/workspaces/${data.$id}`);
                },
            },
        );
    };

    const [members, remainingCount] = useMemo(() => {
        if (membersInfo.length > 2) {
            const membersDisplay = membersInfo.slice(0, 2);
            const membersRemainingCount = membersInfo.slice(2).length;
            return [membersDisplay, membersRemainingCount];
        }

        return [membersInfo, 0];
    }, [membersInfo]);

    return (
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader className="p-7">
                <CardTitle className="text-xl font-bold">
                    <div className="flex items-center justify-between">
                        <span>Join workspace {name}</span>
                        <WorkspaceAvatar name={name} image={imageUrl} />
                    </div>
                </CardTitle>
                {/* Group member avatar */}
                <AvatarGroup className="flex items-center">
                    {members.map((item) => (
                        <Avatar key={item.userId}>
                            <AvatarImage
                                src={
                                    getUserPhoto(item.userId, 72, 72) ||
                                    undefined
                                }
                                alt={item.name || "User Avatar"}
                            />
                            <AvatarFallback className="text-white bg-blue-500 text-sm uppercase">
                                {item.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    ))}
                    {remainingCount > 0 && (
                        <AvatarGroupCount>+{remainingCount}</AvatarGroupCount>
                    )}
                </AvatarGroup>
                <CardDescription>
                    You&apos;ve been invited to join <strong>{name}</strong>{" "}
                    workspace.
                </CardDescription>
            </CardHeader>
            <div className="px-7">
                <DottedSeparator />
            </div>
            <CardContent className="p-7">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-2">
                    <Button
                        variant="secondary"
                        type="button"
                        asChild
                        size="lg"
                        className="w-full lg:w-fit"
                        disabled={joinWorkspace.isPending}
                    >
                        <Link href="/">Cancel</Link>
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={joinWorkspace.isPending}
                        size="lg"
                        className="w-full lg:w-fit"
                        type="button"
                    >
                        Join Workspace
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
