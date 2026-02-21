"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DottedSeparator } from "@/components/dotted-separator";
import { useLogout } from "../api/use-logout";
import { useCurrent } from "../api/use-current";
import {
    Loader2Icon,
    LoaderIcon,
    LogOutIcon,
    CircleDollarSignIcon,
} from "lucide-react";
import { useGetSubscription } from "@/features/subscriptions/api/use-get-subscription";
import { useCheckoutSubscription } from "@/features/subscriptions/api/use-checkout-subscription";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const UserButton = () => {
    const { data: user, isLoading } = useCurrent();
    const { mutate: logout, isPending } = useLogout();
    const checkout = useCheckoutSubscription();
    const { data: subscription, isLoading: isLoadingSubscription } =
        useGetSubscription();

    if (isLoading) {
        return (
            <div className="size-10 rounded-full flex items-center justify-center bg-neutral-200 border border-neutral-300">
                <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!user) return null;

    const { name, email } = user;
    const avatarFallback = name
        ? name.charAt(0).toUpperCase()
        : (email.charAt(0).toUpperCase() ?? "U");

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="outline-none relative">
                <Avatar className="size-10 hover:opacity-75 transition border border-neutral-300">
                    <AvatarFallback className="bg-neutral-200 font-medium text-neutral-500 flex items-center justify-center">
                        {avatarFallback}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={10}
                className="w-60"
            >
                <div className="flex flex-col items-center justify-center gap-2 px-2.5 py-4">
                    <Avatar className="size-[52px] border border-neutral-300">
                        <AvatarFallback className="bg-neutral-200 text-xl font-medium text-neutral-500 flex items-center justify-center">
                            {avatarFallback}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-neutral-900">
                                {name || "User"}
                            </p>
                            <Badge
                                className={cn(
                                    "text-white ml-2",
                                    subscription
                                        ? "bg-yellow-500 hover:bg-yellow-600"
                                        : "bg-neutral-500 hover:bg-neutral-500",
                                )}
                            >
                                {subscription ? "Premium" : "Free"}
                            </Badge>
                        </div>
                        <p className="text-xs text-neutral-500">{email}</p>
                    </div>
                </div>
                <DottedSeparator className="mb-1" />
                <DropdownMenuItem
                    onClick={() => checkout.mutate()}
                    disabled={checkout.isPending || isLoadingSubscription}
                    className="h-10 flex items-center justify-center font-medium cursor-pointer"
                >
                    {checkout.isPending ? (
                        <Loader2Icon className="size-4 text-muted-foreground animate-spin" />
                    ) : (
                        <>
                            <CircleDollarSignIcon className="size-4" />
                            {subscription ? "Manage" : "Upgrade"}
                        </>
                    )}
                </DropdownMenuItem>
                <DottedSeparator className="mb-1" />
                <DropdownMenuItem
                    onClick={() => logout()}
                    disabled={isPending}
                    className="h-10 flex items-center justify-center text-amber-700 font-medium cursor-pointer"
                >
                    <LogOutIcon className="size-4" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
