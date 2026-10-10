import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createNextClient } from "./appwrite-client";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toHttpStatus(
    code?: number,
): 400 | 401 | 403 | 404 | 409 | 429 | 500 {
    if (code === 401) return 401;
    if (code === 403) return 403;
    if (code === 404) return 404;
    if (code === 400) return 400;
    if (code === 409) return 409;
    if (code === 429) return 429;
    return 500;
}

export function generateInviteCode(length: number) {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * characters.length),
        );
    }
    return result;
}

export function snakeCaseToTitleCase(str: string) {
    return str
        .toLowerCase()
        .replace(/_/, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function safeRedirect(url: string | null) {
    if (!url) return "/";

    if (url.startsWith("/")) return url;

    return "/";
}

export async function hashEmail(email: string) {
    const data = new TextEncoder().encode(email.trim().toLowerCase());
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

export function getUserPhoto(
    userId?: string,
    width: number = 128,
    height: number = 128,
) {
    try {
        const { avatars } = createNextClient();
        const avatarUrl = avatars.getPhoto({
            userId,
            width,
            height,
        });

        return avatarUrl;
    } catch (error) {
        console.log(error);
        return null;
    }
}
