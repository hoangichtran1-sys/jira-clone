import { bootstrap } from "@/lib/bootstrap";

async function startCron() {
    // load env trc khi start job
    bootstrap();

    console.log("Starting cron service...");
    const { initializeCrons } = await import("./cron");

    await initializeCrons();
}

startCron().then((error) => {
    console.error(error);
    process.exit(1);
});
