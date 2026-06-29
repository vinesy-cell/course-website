import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "./lib/config.mjs";

const required = [
  "dist/index.html",
  "dist/styles.css",
  "dist/main.js",
  "dist/site-data.json",
  "dist/assets/hero-system.png",
  "dist/assets/微信二维码_李凯_IMG_9523.JPG",
  "dist/assets/公众号二维码_李凯思考笔记_IMG_9524.JPG",
  "dist/assets/李凯_个人主视觉.png",
];

const missing = required.filter((file) => !fs.existsSync(path.join(projectRoot, file)));
if (missing.length) {
  console.error("缺少构建文件：");
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

const data = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "dist", "site-data.json"), "utf8"),
);
const serialized = JSON.stringify(data);
const forbidden = ["AI企业培训师", "浙江大学工商管理硕士"];
const found = forbidden.filter((word) => serialized.includes(word));
if (found.length) {
  console.error(`发现禁用口径：${found.join("、")}`);
  process.exit(1);
}

if (!data.hero?.title || !data.contacts?.phone || !data.contacts?.email) {
  console.error("关键网站内容不完整");
  process.exit(1);
}

if (data.cooperation?.plans?.length !== 4 || data.practice?.length !== 3) {
  console.error("新增合作方案或实践方法内容不完整");
  process.exit(1);
}

console.log("网站检查通过");
console.log(`主标题：${data.hero.title}`);
console.log(`课程数量：${data.courses.length}`);
console.log(`合作方案：${data.cooperation.plans.length}`);
