"use client";

import { LoaderIcon } from "lucide-react";

const Loading = () => {
    return (
        <div className="h-screen flex flex-col gap-y-4 items-center justify-center">
            <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
        </div>
    );
};

export default Loading;
