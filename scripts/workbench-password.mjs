import { spawnSync } from "node:child_process";
import readline from "node:readline";

const account = process.env.USER || "maxlee";
const service = "maxlee-project-workbench-readonly";

function runSecurity(args, input) {
  const result = spawnSync("/usr/bin/security", args, {
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim();
    throw new Error(detail || "钥匙串操作失败");
  }
  return result.stdout.trim();
}

function readSecret(prompt) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let value = "";

    stdout.write(prompt);
    stdin.setEncoding("utf8");
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("已取消"));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (character === "\u007f") {
          value = value.slice(0, -1);
          continue;
        }
        value += character;
      }
    };

    function cleanup() {
      stdin.off("data", onData);
      if (stdin.isTTY) stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    }

    stdin.on("data", onData);
  });
}

const command = process.argv[2] || "check";

if (command === "check") {
  try {
    runSecurity(["find-generic-password", "-a", account, "-s", service, "-w"]);
    console.log("工作台密码已保存在本机钥匙串。");
  } catch {
    console.log("工作台密码尚未设置。");
    process.exitCode = 1;
  }
} else if (command === "set") {
  const password = await readSecret("设置工作台登录密码（不会显示）：");
  if (password.length < 12) {
    throw new Error("密码至少需要 12 位。");
  }
  runSecurity([
    "add-generic-password",
    "-U",
    "-a",
    account,
    "-s",
    service,
    "-w",
    password,
  ]);
  console.log("工作台密码已写入本机钥匙串。");
} else if (command === "remove") {
  try {
    runSecurity(["delete-generic-password", "-a", account, "-s", service]);
    console.log("工作台密码已从本机钥匙串删除。");
  } catch {
    console.log("钥匙串中没有找到工作台密码。");
  }
} else {
  console.error("用法：node scripts/workbench-password.mjs [check|set|remove]");
  process.exitCode = 2;
}

