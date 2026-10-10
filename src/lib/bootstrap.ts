import { loadEnvConfig } from "@next/env";
import path from "path";

export function bootstrap() {
    const projectDir = path.resolve(process.cwd());
    loadEnvConfig(projectDir);
}
