#!/usr/bin/env node
/**
 * GitHub 远程仓库初始配置脚本
 * 用法：node scripts/setup-github.mjs <github-username> <repo-name>
 * 示例：node scripts/setup-github.mjs maxlee course-website
 */

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: root, encoding: "utf8", stdio: opts.silent ? "pipe" : "inherit", ...opts });
}

function tryRun(cmd) {
  try { return run(cmd, { silent: true }); } catch { return ""; }
}

const [, , username, repo] = process.argv;

if (!username || !repo) {
  console.error("用法：node scripts/setup-github.mjs <github用户名> <仓库名>");
  console.error("示例：node scripts/setup-github.mjs maxlee course-website");
  process.exit(1);
}

const remoteUrl = `git@github.com:${username}/${repo}.git`;
const httpsUrl = `https://github.com/${username}/${repo}`;

console.log("\n===== GitHub 远程仓库配置 =====");
console.log(`目标仓库：${httpsUrl}`);

// 1. 检查是否已有 remote
const existing = tryRun("git remote get-url origin").trim();
if (existing) {
  console.log(`\n当前 origin 已指向：${existing}`);
  console.log("如需更换，请先执行：git remote remove origin");
  process.exit(0);
}

// 2. 测试 SSH 连通性
console.log("\n[1/4] 测试 SSH 与 GitHub 的连通性...");
try {
  execSync("ssh -o StrictHostKeyChecking=accept-new -T git@github.com 2>&1 || true", {
    encoding: "utf8", timeout: 10000,
  });
  console.log("      SSH 测试完成（如果看到 'Hi ...' 说明密钥已添加）");
} catch {
  console.log("      SSH 测试超时或失败，请确认公钥已添加到 GitHub");
}

// 3. 添加 remote
console.log(`\n[2/4] 添加远程仓库 origin → ${remoteUrl}`);
run(`git remote add origin ${remoteUrl}`);
console.log("      已添加");

// 4. 推送
console.log("\n[3/4] 推送代码到 GitHub...");
try {
  run("git push -u origin main");
  console.log("      推送成功！");
} catch (e) {
  console.error("\n推送失败。请检查：");
  console.error("  1. GitHub 上是否已创建同名仓库（空仓库）");
  console.error("  2. 公钥是否已添加到 GitHub → Settings → SSH and GPG keys");
  console.error(`  3. 仓库地址是否正确：${remoteUrl}`);
  process.exit(1);
}

// 5. 说明下一步
console.log(`
[4/4] 完成！请在 GitHub 网站上完成最后一步：

  1. 打开仓库：${httpsUrl}
  2. 点击 Settings → Pages
  3. Source 选择：GitHub Actions
  4. 保存后，GitHub Actions 会自动部署

部署完成后，网站地址将是：
  https://${username}.github.io/${repo}/

之后只需在后台点击"发布上线"即可更新网站。
`);
