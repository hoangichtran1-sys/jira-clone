import { loadEnvConfig } from "@next/env";
import path from "path";

export function bootstrap() {
    console.log(process.cwd());
    const projectDir = path.resolve(process.cwd());
    loadEnvConfig(projectDir);
}
