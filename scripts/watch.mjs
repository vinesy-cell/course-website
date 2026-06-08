import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readConfig } from "./lib/config.mjs";
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
  const watcher = fs.watch(
    config.contentRoot,
    { recursive: true },
    (_eventType, fileName) => {
      if (!fileName || String(fileName).includes(".DS_Store")) return;
      clearTimeout(timer);
      timer = setTimeout(() => rebuild(`内容变化：${fileName}`), 900);
    },
  );
  return watcher;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "")) {
  startWatcher();
  console.log(`正在监听内容源：${config.contentRoot}`);
}
