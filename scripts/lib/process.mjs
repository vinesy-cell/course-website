import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "./config.mjs";

export const logFile = path.join(projectRoot, ".robot.log");

export function appendLog(message) {
  const line = `[${new Date().toLocaleString("zh-CN")}] ${message}\n`;
  fs.appendFileSync(logFile, line, "utf8");
}

export function readLog(lines = 120) {
  if (!fs.existsSync(logFile)) return "";
  return fs
    .readFileSync(logFile, "utf8")
    .trim()
    .split("\n")
    .slice(-lines)
    .join("\n");
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
