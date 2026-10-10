import PusherServer from "pusher";
import PusherClient from "pusher-js";
import { env } from "./env";

export const pusherServer = new PusherServer({
    appId: env.PUSHER_APP_ID,
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    secret: env.PUSHER_SECRET,
    cluster: "ap1",
    useTLS: true,
});

export const pusherClient = new PusherClient(
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    {
        cluster: "ap1",
    },
);
