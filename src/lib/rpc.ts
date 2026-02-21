import { hc } from "hono/client";

import { AppType } from "@/app/api/[[...route]]/route";
import { ErrorResponse } from "@/types";

export const client = hc<AppType>(process.env.NEXT_PUBLIC_API_URL!);

export async function handleResponse<T>(response: Promise<{ ok: boolean, json: () => Promise<T> }>) {
    const res = await response;
    const data = await res.json();

    if (!res.ok) {
        const errorData = data as ErrorResponse;
        throw new Error(errorData.error || "Something went wrong");
    }

    return data as T;
}