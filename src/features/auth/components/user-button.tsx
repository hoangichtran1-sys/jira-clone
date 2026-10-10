"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DottedSeparator } from "@/components/dotted-separator";
import {
    Loader2Icon,
    LoaderIcon,
    LogOutIcon,
    CircleDollarSignIcon,
    ZapIcon,
    HeadphonesIcon,
    BellIcon,
    ShieldCheckIcon,
} from "lucide-react";
import { useGetSubscription } from "@/features/subscriptions/api/use-get-subscription";
import { useCheckoutSubscription } from "@/features/subscriptions/api/use-checkout-subscription";
import { Badge } from "@/components/ui/badge";
import { cn, getUserPhoto } from "@/lib/utils";
import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { userIdAtom } from "../atoms/user-id-atom";
import { useNotificationModal } from "@/features/workspaces/hooks/use-notification-modal";
import { useAuth } from "@appwrite.io/react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSendVerificationLink } from "../api/use-send-verification-link";
import { useParamsStates } from "@/hooks/use-params-state";
import { confettiState } from "@/features/subscriptions/atoms/confetti-state";
import { useQueryClient } from "@tanstack/react-query";

export const UserButton = () => {
    const router = useRouter();
    const pathname = usePathname();
    const queryClient = useQueryClient();

    const { user, isLoading, signOut } = useAuth();

    const setUserId = useSetAtom(userIdAtom);
    const { onOpen } = useNotificationModal();

    const [paramsState, setParamsState] = useParamsStates();
    const setOpenConfetti = useSetAtom(confettiState);

    const checkout = useCheckoutSubscription();
    const sendVerificationLink = useSendVerificationLink();
    const { data: subscription, isLoading: isLoadingSubscription } =
        useGetSubscription();

    useEffect(() => {
        if (!isLoading && user) setUserId(user.$id);
    }, [setUserId, user, isLoading]);

    useEffect(() => {
        if (paramsState.success) {
            setOpenConfetti(true);
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
            toast.success("Your account upgrade successfully");

            setParamsState({ success: null }, { history: "replace" });
        }
    }, [queryClient, setOpenConfetti, setParamsState, paramsState.success]);

    useEffect(() => {
        if (paramsState.isVerify === true) {
            toast.success("Email verify success");
            setParamsState({ isVerify: null }, { history: "replace" });
        } else if (paramsState.isVerify === false) {
            toast.error("Failed to verify email");
            setParamsState({ isVerify: null }, { history: "replace" });
        }
    }, [paramsState.isVerify, setParamsState]);

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

    const isVerifyEmail = user.emailVerification;

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="outline-none relative">
                <Avatar className="size-10 hover:opacity-75 transition border border-neutral-300">
                    <AvatarImage
                        src={getUserPhoto(user.$id) || undefined}
                        alt={user.name}
                    />
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
                        <AvatarImage
                            src={getUserPhoto(user.$id) || undefined}
                            alt={user.name}
                        />
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
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-xs",
                                isVerifyEmail
                                    ? "text-emerald-500"
                                    : "text-red-500",
                            )}
                        >
                            {isVerifyEmail ? "Verified" : "Not verified"}
                        </Badge>
                    </div>
                </div>
                <DottedSeparator className="mb-1" />
                {!isVerifyEmail && (
                    <DropdownMenuItem
                        onClick={() =>
                            sendVerificationLink.mutate({
                                query: { origin: pathname },
                            })
                        }
                        className="h-10 flex items-center justify-center font-medium cursor-pointer"
                    >
                        <ShieldCheckIcon className="size-4" />
                        Verify email now
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem
                    onClick={() => checkout.mutate()}
                    disabled={checkout.isPending || isLoadingSubscription}
                    className="h-10 flex items-center justify-center font-medium cursor-pointer"
                >
                    {checkout.isPending ? (
                        <Loader2Icon className="size-4 text-muted-foreground animate-spin" />
                    ) : (
                        <>
                            {subscription ? (
                                <CircleDollarSignIcon className="size-4" />
                            ) : (
                                <ZapIcon className="size-4" />
                            )}
                            {subscription
                                ? "Manage Subscription"
                                : "Upgrade to Pro"}
                        </>
                    )}
                </DropdownMenuItem>
                <DottedSeparator className="mb-1" />
                <DropdownMenuItem className="h-10 flex items-center justify-center font-medium cursor-pointer">
                    <HeadphonesIcon className="size-4" />
                    <a
                        href="https://mail.google.com/mail/u/0/?view=cm&fs=1&to=hoangichtran@gmail.com"
                        target="_blank"
                        title="Gmail"
                    >
                        Help Center
                    </a>
                </DropdownMenuItem>
                <DottedSeparator className="mb-1" />
                <DropdownMenuItem
                    onClick={onOpen}
                    className="h-10 flex items-center justify-center font-medium cursor-pointer"
                >
                    <BellIcon className="size-4" />
                    Send notification
                </DropdownMenuItem>
                <DottedSeparator className="mb-1" />
                <DropdownMenuItem
                    onClick={() =>
                        signOut.signOut({
                            onSuccess() {
                                toast.success("Logout successfully");
                                router.push("/sign-in");
                            },
                            onError(error) {
                                console.log(error);
                                toast.error(error.message);
                            },
                        })
                    }
                    disabled={signOut.isPending}
                    className="h-10 flex items-center justify-center text-amber-700 font-medium cursor-pointer"
                >
                    <LogOutIcon className="size-4" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
