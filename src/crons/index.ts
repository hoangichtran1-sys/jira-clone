import { bootstrap } from "@/lib/bootstrap";
import { initializeCrons } from "./cron";

async function start() {
    // load env trc khi start job
    bootstrap();

    console.log("Starting cron service...");

    await initializeCrons();
}

start();
