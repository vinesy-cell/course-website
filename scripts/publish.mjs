import { run } from "./lib/process.mjs";

async function hasRemote() {
  try {
    const remote = (await run("git", ["remote", "get-url", "origin"])).stdout.trim();
    return Boolean(remote);
  } catch {
    return false;
  }
}

async function hasChanges() {
  const status = (await run("git", ["status", "--porcelain"])).stdout.trim();
  return Boolean(status);
}

async function hasHead() {
  try {
    await run("git", ["rev-parse", "--verify", "HEAD"]);
    return true;
  } catch {
    return false;
  }
}

await run("npm", ["run", "content:sync"]);
await run("npm", ["run", "build"]);
await run("npm", ["run", "check"]);

if (!(await hasRemote())) {
  console.error("尚未配置远程仓库，无法发布到公网。");
  console.error("配置方式：git remote add origin <你的 GitHub 仓库地址>");
  console.error("然后再次运行：npm run publish");
  process.exit(2);
}

await run("git", ["add", "."]);

if (await hasChanges()) {
  const message = `content: sync course website ${new Date()
    .toISOString()
    .slice(0, 16)}`;
  await run("git", ["commit", "-m", message]);
} else if (!(await hasHead())) {
  await run("git", ["commit", "--allow-empty", "-m", "chore: initialize course website"]);
} else {
  console.log("没有新的内容变化，跳过提交。");
}

const branch = (await run("git", ["branch", "--show-current"])).stdout.trim() || "main";
await run("git", ["push", "-u", "origin", branch]);
console.log("发布推送完成。GitHub Pages / 部署平台会继续自动构建上线。");
