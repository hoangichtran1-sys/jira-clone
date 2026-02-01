import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toHttpStatus(code?: number): 400 | 401 | 403 | 404 | 500 {
    if (code === 401) return 401;
    if (code === 403) return 403;
    if (code === 404) return 404;
    if (code === 400) return 400;
    if (code === 409) return 409;
    if (code === 429) return 429;
    return 500;
}
