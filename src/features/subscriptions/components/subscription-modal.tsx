"use client";

import { useCheckoutSubscription } from "../api/use-checkout-subscription";
import { useSubscriptionModal } from "../hooks/use-subscription-modal";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon } from "lucide-react";
import Image from "next/image";

export const SubscriptionModal = () => {
    const checkout = useCheckoutSubscription();
    const { isSubscriptionStateModal, setSubscriptionStateModal } =
        useSubscriptionModal();

    return (
        <Dialog
            open={isSubscriptionStateModal}
            onOpenChange={setSubscriptionStateModal}
        >
            <DialogContent>
                <DialogHeader className="flex items-center space-y-4">
                    <Image src="/logo.svg" alt="Logo" width={36} height={36} />
                    <DialogTitle>Upgrade to a paid plan</DialogTitle>
                    <DialogDescription className="text-center">
                        Upgrade to a paid plan to unlock more features
                    </DialogDescription>
                </DialogHeader>
                <Separator />
                <ul className="space-y-2">
                    <li className="flex items-center">
                        <CheckCircle2Icon className="size-5 fill-blue-500 text-white" />
                        <p className="text-sm text-muted-foreground">
                            Unlimited number of workspaces
                        </p>
                    </li>
                    <li className="flex items-center">
                        <CheckCircle2Icon className="size-5 fill-blue-500 text-white" />
                        <p className="text-sm text-muted-foreground">
                            The number of projects in the workspace is unlimited
                        </p>
                    </li>
                    <li className="flex items-center">
                        <CheckCircle2Icon className="size-5 fill-blue-500 text-white" />
                        <p className="text-sm text-muted-foreground">
                            Manage tasks across multiple views
                        </p>
                    </li>
                </ul>
                <DialogFooter className="pt-2 mt-4 gap-y-2">
                    <Button
                        className="w-full"
                        disabled={checkout.isPending}
                        onClick={() => checkout.mutate()}
                    >
                        Upgrade
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
