import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projectRoot, readConfig } from "./lib/config.mjs";
import { appendLog, run } from "./lib/process.mjs";

const config = readConfig();
let timer = null;
let running = false;
let queued = false;

async function rebuild(reason = "内容变化") {
  if (running) {
    queued = true;
    return;
  }
  running = true;
  appendLog(`检测到${reason}，开始自动同步`);
  try {
    await run("npm", ["run", "content:sync"]);
    await run("npm", ["run", "build"]);
    await run("npm", ["run", "check"]);
    if (config.autoPublish) {
      await run("npm", ["run", "publish"]);
    }
  } catch (error) {
    appendLog(`自动同步失败：${error.message}`);
  } finally {
    running = false;
    if (queued) {
      queued = false;
      rebuild("队列中的内容变化");
    }
  }
}

export function startWatcher() {
  appendLog(`开始监听内容源：${config.contentRoot}`);
  const projectRelativeRoot = path.relative(config.contentRoot, projectRoot);
  const watcher = fs.watch(
    config.contentRoot,
    { recursive: true },
    (_eventType, fileName) => {
      if (!fileName || String(fileName).includes(".DS_Store")) return;
      const changedName = String(fileName);
      // macOS 可能把监听根目录本身作为事件名返回，这不是内容文件变化。
      if (changedName === path.basename(config.contentRoot)) return;
      const changedPath = path.resolve(config.contentRoot, changedName);
      if (fs.existsSync(changedPath) && fs.statSync(changedPath).isDirectory()) {
        return;
      }
      const changedRelativeToProject = path.relative(projectRoot, changedPath);
      // 网站工程会生成 .last-sync、public 和 dist 等文件；这些不属于内容源，
      // 必须排除，否则机器人会因自己的构建结果反复触发同步。
      if (
        projectRelativeRoot &&
        (changedName === projectRelativeRoot ||
          changedName.startsWith(`${projectRelativeRoot}${path.sep}`))
      ) {
        return;
      }
      if (
        changedRelativeToProject === "" ||
        (!changedRelativeToProject.startsWith("..") &&
          !path.isAbsolute(changedRelativeToProject))
      ) {
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(() => rebuild(`内容变化：${changedName}`), 900);
    },
  );
  return watcher;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "")) {
  startWatcher();
  console.log(`正在监听内容源：${config.contentRoot}`);
}
