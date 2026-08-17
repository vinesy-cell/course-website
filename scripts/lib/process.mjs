import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "./config.mjs";

export const logFile = path.join(projectRoot, ".robot.log");
const LOG_TAIL_BYTES = 256 * 1024;

export function appendLog(message) {
  const line = `[${new Date().toLocaleString("zh-CN")}] ${message}\n`;
  fs.appendFileSync(logFile, line, "utf8");
}

export function readLog(lines = 120) {
  if (!fs.existsSync(logFile)) return "";
  const { size } = fs.statSync(logFile);
  const start = Math.max(0, size - LOG_TAIL_BYTES);
  const length = size - start;
  const fd = fs.openSync(logFile, "r");
  const buffer = Buffer.alloc(length);
  try {
    fs.readSync(fd, buffer, 0, length, start);
  } finally {
    fs.closeSync(fd);
  }
  const text = buffer.toString("utf8");
  return text
    .split("\n")
    .slice(start > 0 ? 1 : 0)
    .slice(-lines)
    .join("\n")
    .trim();
}

export function run(command, args = [], options = {}) {
  const cwd = options.cwd || projectRoot;
  const label = [command, ...args].join(" ");
  const shouldLog = options.log !== false;
  if (shouldLog) appendLog(`开始：${label}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      env: { ...process.env, ...(options.env || {}) },
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (shouldLog) appendLog(text.trimEnd());
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (shouldLog) appendLog(text.trimEnd());
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        if (shouldLog) appendLog(`完成：${label}`);
        resolve({ stdout, stderr, code });
      } else {
        const error = new Error(`命令失败：${label}`);
        error.stdout = stdout;
        error.stderr = stderr;
        error.code = code;
        if (shouldLog) appendLog(`失败：${label}（退出码 ${code}）`);
        reject(error);
      }
    });
  });
}
