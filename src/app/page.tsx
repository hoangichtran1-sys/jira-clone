"use client";

import { Button } from "@/components/ui/button";
import { useCurrent } from "@/features/auth/api/use-current";
import { useLogout } from "@/features/auth/api/use-logout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Page = () => {
    const router = useRouter();
    const { data, isLoading } = useCurrent();
    const logout = useLogout();

    useEffect(() => {
        if (!data && !isLoading) {
            router.push("/sign-in");
        }
    }, [data, router, isLoading]);

    return (
        <div className=" flex flex-col justify-center items-center gap-2">
            Only visible to authorized users.
            <pre>{JSON.stringify(data, null, 2)}</pre>
            <Button
                variant="destructive"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
            >
                Logout
            </Button>
        </div>
    );
};

export default Page;
