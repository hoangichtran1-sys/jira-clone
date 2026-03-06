import { loadEnvConfig } from "@next/env";

export function bootstrap() {
  loadEnvConfig(process.cwd());
}