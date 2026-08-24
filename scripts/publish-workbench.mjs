import { run } from "./lib/process.mjs";

const managedPaths = [
  "public/workbench",
  "scripts/sync-workbench.mjs",
  "scripts/publish-workbench.mjs",
  "package.json",
  "docs/手机只读项目工作台.md",
];

async function ensureCleanIndex() {
  const staged = (await run("git", ["diff", "--cached", "--name-only"])).stdout.trim();
  if (staged) {
    throw new Error("检测到已有暂存改动。请先处理现有暂存内容，再发布手机工作台。");
  }
}

async function ensureRemote() {
  const remote = (await run("git", ["remote", "get-url", "origin"])).stdout.trim();
  if (!remote) {
    throw new Error("尚未配置 origin，无法发布手机工作台。");
  }
}

await ensureCleanIndex();
await ensureRemote();
await run("npm", ["run", "workbench:sync"]);
await run("npm", ["run", "build"]);
await run("npm", ["run", "check"]);
await run("git", ["add", "--", ...managedPaths]);

const changed = (await run("git", ["diff", "--cached", "--name-only"])).stdout.trim();
if (!changed) {
  console.log("手机工作台没有新的确认快照，跳过提交与推送。");
  process.exit(0);
}

const message = `workbench: sync mobile snapshot ${new Date().toISOString().slice(0, 16)}`;
await run("git", ["commit", "-m", message]);
const branch = (await run("git", ["branch", "--show-current"])).stdout.trim() || "main";
await run("git", ["push", "-u", "origin", branch]);

console.log("手机只读工作台已同步并推送，部署平台将更新 /workbench/。");
