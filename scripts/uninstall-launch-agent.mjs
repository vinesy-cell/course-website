import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const label = "com.maxlee.course-site-robot";
const plistPath = path.join(
  os.homedir(),
  "Library",
  "LaunchAgents",
  `${label}.plist`,
);

spawnSync("launchctl", ["bootout", `gui/${process.getuid()}`, plistPath], {
  stdio: "ignore",
});
if (fs.existsSync(plistPath)) fs.unlinkSync(plistPath);
console.log("网站机器人后台服务已卸载");
