import { bootstrap } from "@/lib/bootstrap";

async function start() {
  // load env trc khi run worker
  bootstrap();

  await import("./email-worker");
  //await import("./notification-worker");

  console.log("Worker is running...");
}

start();
