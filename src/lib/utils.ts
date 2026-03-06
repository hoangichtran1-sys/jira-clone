import { IMAGES_BUCKET_ID } from "@/config/appwrite";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export function generateImageUrl(fileId: string) {
    const convertImageUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${IMAGES_BUCKET_ID}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`;

    return convertImageUrl;
}
