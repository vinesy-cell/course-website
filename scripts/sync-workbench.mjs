import { createCipheriv, createHash, pbkdf2Sync, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const vaultRoot = "/Users/maxlee/Documents/MAXNOTE";
const workbenchRoot = path.join(vaultRoot, "02_项目办公室/00_项目工作台");
const sourceHtml = path.join(workbenchRoot, "index.html");
const sourceData = path.join(workbenchRoot, "project-workbench-data.js");
const outputRoot = path.join(projectRoot, "public/workbench");
const passwordService = "maxlee-project-workbench-readonly";
const account = process.env.USER || "maxlee";
const iterations = 310000;

function readPassword() {
  if (process.env.WORKBENCH_PASSWORD) {
    return process.env.WORKBENCH_PASSWORD;
  }
  try {
    return execFileSync("/usr/bin/security", [
      "find-generic-password",
      "-a",
      account,
      "-s",
      passwordService,
      "-w",
    ], { encoding: "utf8" }).trim();
  } catch {
    throw new Error("尚未设置工作台密码。请先运行 npm run workbench:password:set");
  }
}

function parseWorkbenchData(text) {
  // Earlier snapshots derived `portfolio` after the primary object. Current
  // snapshots serialize the complete JSON object directly. Keep both forms
  // readable so a local refresh always has one matching mobile-sync path.
  const legacyMatch = text.match(
    /window\.PROJECT_WORKBENCH_DATA\s*=\s*([\s\S]*?);\s*window\.PROJECT_WORKBENCH_DATA\.portfolio\s*=/,
  );
  const directMatch = text.match(
    /window\.PROJECT_WORKBENCH_DATA\s*=\s*([\s\S]*?);\s*$/,
  );
  const match = legacyMatch || directMatch;
  if (!match) {
    throw new Error("无法从 project-workbench-data.js 读取工作台数据。");
  }
  return JSON.parse(match[1]);
}

function encryptJson(data, password) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(data), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    version: 1,
    algorithm: "AES-256-GCM",
    kdf: "PBKDF2-SHA-256",
    iterations,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    tag: tag.toString("base64"),
  };
}

function buildPrivateHtml(source) {
  const dataScript = '<script src="project-workbench-data.js"></script>';
  const renderStart = "    (function () {\n      var vault = \"MAXNOTE\";";
  const renderEnd = "      renderOperations();\n    }());";
  if (!source.includes(dataScript) || !source.includes(renderStart) || !source.includes(renderEnd)) {
    throw new Error("项目工作台 HTML 结构已变化，未执行自动改写。");
  }
  return source
    .replace(dataScript, '<script src="workbench-auth.js"></script>')
    .replace(renderStart, "    window.renderWorkbench = function () {\n      var vault = \"MAXNOTE\";")
    .replace(renderEnd, "      renderOperations();\n    };");
}

function copyAssets() {
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.cpSync(path.join(workbenchRoot, "assets"), path.join(outputRoot, "assets"), { recursive: true });
  fs.copyFileSync(path.join(scriptDir, "templates/workbench-auth.js"), path.join(outputRoot, "workbench-auth.js"));
}

const data = parseWorkbenchData(fs.readFileSync(sourceData, "utf8"));

if (process.argv.includes("--dry-run")) {
  const html = buildPrivateHtml(fs.readFileSync(sourceHtml, "utf8"));
  console.log(`工作台数据解析通过：${JSON.stringify(data).length} 字节`);
  console.log(`HTML改写通过：${createHash("sha256").update(html).digest("hex").slice(0, 12)}`);
  process.exit(0);
}

const password = readPassword();
const encrypted = encryptJson(data, password);
copyAssets();
fs.writeFileSync(path.join(outputRoot, "index.html"), buildPrivateHtml(fs.readFileSync(sourceHtml, "utf8")), "utf8");
fs.writeFileSync(path.join(outputRoot, "data.enc.json"), JSON.stringify(encrypted), "utf8");
console.log(`只读工作台已生成：${path.relative(projectRoot, outputRoot)}`);
console.log(`数据快照日期：${data.snapshot_date || "未标记"}`);
