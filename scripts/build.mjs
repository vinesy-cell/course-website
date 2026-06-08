import fs from "node:fs";
import path from "node:path";
import { ensureDirectory, projectRoot } from "./lib/config.mjs";

const dist = path.join(projectRoot, "dist");
const source = path.join(projectRoot, "src");
const publicDirectory = path.join(projectRoot, "public");
const contentFile = path.join(projectRoot, "content", "site-data.json");

if (!fs.existsSync(contentFile)) {
  throw new Error("缺少 content/site-data.json，请先运行 npm run content:sync");
}

fs.rmSync(dist, { recursive: true, force: true });
ensureDirectory(dist);
fs.cpSync(source, dist, { recursive: true });
fs.cpSync(publicDirectory, dist, { recursive: true });
fs.copyFileSync(contentFile, path.join(dist, "site-data.json"));
fs.writeFileSync(path.join(dist, ".nojekyll"), "", "utf8");

console.log(`网站构建完成：${dist}`);
