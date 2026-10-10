import "server-only";
import fs from "fs";
import path from "path";

export function loadMarkdown(file: string) {
    const filePath = path.join(process.cwd(), "src/content", file);
    return fs.readFileSync(filePath, "utf-8");
}
