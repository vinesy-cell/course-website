import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { projectRoot, readConfig } from "./lib/config.mjs";

const config = readConfig();
const dist = path.join(projectRoot, "dist");
const port = config.previewPort;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8",
};

function send(response, status, body, type = "text/plain; charset=utf-8") {
  response.writeHead(status, { "Content-Type": type });
  response.end(body);
}

function serveFile(request, response) {
  const pathname = decodeURIComponent(new URL(request.url, `http://localhost:${port}`).pathname);
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const target = path.normalize(path.join(dist, relative));
  if (!target.startsWith(dist)) return send(response, 403, "Forbidden");
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    return send(response, 404, "Not found");
  }
  send(response, 200, fs.readFileSync(target), types[path.extname(target)] || "application/octet-stream");
}

const server = http.createServer(serveFile);
server.listen(port, () => {
  console.log(`本地预览：http://localhost:${port}`);
});
