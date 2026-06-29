import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { projectRoot } from "./lib/config.mjs";

const label = "com.maxlee.course-site-robot";
const agents = path.join(os.homedir(), "Library", "LaunchAgents");
const plistPath = path.join(agents, `${label}.plist`);
const robotScript = path.join(projectRoot, "scripts", "robot.mjs");
const logs = path.join(os.homedir(), "Library", "Logs");
const logPath = path.join(logs, "course-site-robot.log");
const executablePath = [
  path.dirname(process.execPath),
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
  "/usr/sbin",
  "/sbin",
].join(":");

fs.mkdirSync(agents, { recursive: true });
fs.mkdirSync(logs, { recursive: true });

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${process.execPath}</string>
    <string>${robotScript}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${projectRoot}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${executablePath}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${logPath}</string>
  <key>StandardErrorPath</key>
  <string>${logPath}</string>
</dict>
</plist>
`;

fs.writeFileSync(plistPath, xml, "utf8");
spawnSync("launchctl", ["bootout", `gui/${process.getuid()}`, plistPath], {
  stdio: "ignore",
});
spawnSync(
  "launchctl",
  ["enable", `gui/${process.getuid()}/${label}`],
  { stdio: "ignore" },
);
const result = spawnSync(
  "launchctl",
  ["bootstrap", `gui/${process.getuid()}`, plistPath],
  { encoding: "utf8" },
);

if (result.status !== 0) {
  console.error(result.stderr || "后台服务安装失败");
  process.exit(result.status || 1);
}

console.log(`网站机器人后台服务已安装：${plistPath}`);
console.log("后台地址：http://localhost:4174");
