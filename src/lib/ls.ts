import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import { env } from "./env";

export const setupLemon = () => {
    return lemonSqueezySetup({
        apiKey: env.LEMONSQUEEZY_API_KEY,
    });
};
