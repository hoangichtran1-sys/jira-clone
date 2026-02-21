"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const Page = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    useEffect(() => {
        const run = async () => {
            // invalidate subscription
            await queryClient.refetchQueries({
                queryKey: ["subscription"],
            });

            toast.success("Your account upgrade successfully");

            setTimeout(() => {
                router.replace("/");
            }, 500);
        };

        run();
    }, [queryClient, router]);

    return <div>Processing your subscription...</div>;
};

export default Page;
