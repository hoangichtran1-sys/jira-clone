import { bootstrap } from "../lib/bootstrap";

bootstrap();

import { initializeCrons } from "./cron";

console.log("Starting cron service...");

initializeCrons();
