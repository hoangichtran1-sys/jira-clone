import { bootstrap } from "./bootstrap";

bootstrap();

import { initializeCrons } from "./cron";

console.log("Starting cron service...");

initializeCrons();
