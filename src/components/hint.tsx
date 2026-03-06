"use client";

import React from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";
import { cn } from "@/lib/utils";

interface HintProps {
    children: React.ReactNode;
    html: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    className?: string;
}

export const Hint = ({
    children,
    html,
    side = "top",
    align = "center",
    className,
}: HintProps) => {
    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent
                    className={cn(className)}
                    side={side}
                    align={align}
                >
                    {html}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
