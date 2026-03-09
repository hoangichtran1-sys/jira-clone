import fs from "fs";
import path from "path";

export async function loadWorkers() {
  const workersDir = path.join(__dirname);

  const files = fs
    .readdirSync(workersDir)
    .filter((file) => file.endsWith(".worker.ts") || file.endsWith(".worker.js"));

  for (const file of files) {
    const modulePath = path.join(workersDir, file);

    const workerModule = await import(modulePath);

    for (const key of Object.keys(workerModule)) {
      if (key.startsWith("start")) {
        workerModule[key]();
        console.log(`✅ Started ${key}`);
      }
    }
  }
}