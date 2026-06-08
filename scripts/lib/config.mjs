import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export function readConfig() {
  const configPath = path.join(projectRoot, "site.config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  return {
    ...config,
    contentRoot: process.env.COURSE_CONTENT_ROOT || config.contentRoot,
    adminPort: Number(process.env.ADMIN_PORT || config.adminPort || 4174),
    previewPort: Number(process.env.PREVIEW_PORT || config.previewPort || 4173),
    autoPublish:
      process.env.AUTO_PUBLISH === "true" || Boolean(config.autoPublish),
  };
}

export function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

export function writeJson(filePath, value) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function nowIso() {
  return new Date().toISOString();
}
