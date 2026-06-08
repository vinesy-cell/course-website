import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDirectory, projectRoot, readConfig } from "./lib/config.mjs";
import { appendLog, readLog, run } from "./lib/process.mjs";

const config = readConfig();
const adminRoot = path.join(projectRoot, "admin");
const distRoot = path.join(projectRoot, "dist");
let busy = false;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function json(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value, null, 2));
}

function send(response, status, body, type = "text/plain; charset=utf-8") {
  response.writeHead(status, { "Content-Type": type });
  response.end(body);
}

async function gitInfo() {
  const info = { branch: "", remote: "", dirty: false, hasCommits: false };
  try {
    info.branch = (await run("git", ["branch", "--show-current"], { log: false })).stdout.trim();
    info.remote = (await run("git", ["remote", "get-url", "origin"], { log: false })).stdout.trim();
  } catch {
    info.remote = "";
  }
  try {
    await run("git", ["rev-parse", "--verify", "HEAD"], { log: false });
    info.hasCommits = true;
  } catch {
    info.hasCommits = false;
  }
  try {
    info.dirty = Boolean(
      (await run("git", ["status", "--porcelain"], { log: false })).stdout.trim(),
    );
  } catch {
    info.dirty = false;
  }
  return info;
}

function readLastSync() {
  const file = path.join(projectRoot, ".last-sync.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function status() {
  const git = await gitInfo();
  const lastSync = readLastSync();
  const dataFile = path.join(projectRoot, "content", "site-data.json");
  const data = fs.existsSync(dataFile)
    ? JSON.parse(fs.readFileSync(dataFile, "utf8"))
    : null;

  return {
    config,
    git,
    lastSync,
    distReady: fs.existsSync(path.join(distRoot, "index.html")),
    dataReady: Boolean(data),
    title: data?.hero?.title || "",
    syncedAt: data?.meta?.syncedAt || "",
    publishReady: Boolean(git.remote),
    previewUrl: `http://localhost:${config.adminPort}/preview/`,
    logs: readLog(),
  };
}

async function runExclusive(task) {
  if (busy) {
    const error = new Error("机器人正在执行上一个任务，请稍后。");
    error.status = 409;
    throw error;
  }
  busy = true;
  try {
    return await task();
  } finally {
    busy = false;
  }
}

async function action(name) {
  return runExclusive(async () => {
    appendLog(`后台触发：${name}`);
    if (name === "sync") {
      await run("npm", ["run", "content:sync"]);
    } else if (name === "build") {
      await run("npm", ["run", "content:sync"]);
      await run("npm", ["run", "build"]);
      await run("npm", ["run", "check"]);
    } else if (name === "check") {
      await run("npm", ["run", "check"]);
    } else if (name === "publish") {
      await run("npm", ["run", "publish"]);
    } else {
      const error = new Error("未知操作");
      error.status = 404;
      throw error;
    }
    return status();
  });
}

function serveStatic(root, pathname, response) {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded === "/" ? "index.html" : decoded.slice(1);
  const target = path.normalize(path.join(root, relative));
  if (!target.startsWith(root)) return send(response, 403, "Forbidden");
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    return send(response, 404, "Not found");
  }
  send(response, 200, fs.readFileSync(target), types[path.extname(target)] || "application/octet-stream");
}

export function startAdminServer() {
  ensureDirectory(adminRoot);
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://localhost:${config.adminPort}`);
    try {
      if (url.pathname === "/api/status") return json(response, 200, await status());
      if (url.pathname === "/api/logs") return json(response, 200, { logs: readLog() });
      if (url.pathname.startsWith("/api/") && request.method === "POST") {
        return json(response, 200, await action(url.pathname.replace("/api/", "")));
      }
      if (url.pathname === "/preview" || url.pathname === "/preview/") {
        return serveStatic(distRoot, "/", response);
      }
      if (url.pathname.startsWith("/preview/")) {
        return serveStatic(distRoot, url.pathname.replace("/preview", ""), response);
      }
      return serveStatic(adminRoot, url.pathname, response);
    } catch (error) {
      appendLog(error.message);
      return json(response, error.status || 500, {
        error: error.message,
        logs: readLog(),
      });
    }
  });

  server.listen(config.adminPort, "127.0.0.1", () => {
    appendLog(`后台已启动：http://localhost:${config.adminPort}`);
    console.log(`网站机器人后台：http://localhost:${config.adminPort}`);
  });

  return server;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "")) {
  startAdminServer();
}
