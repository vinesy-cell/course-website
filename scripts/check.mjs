import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "./lib/config.mjs";

const required = [
  "dist/index.html",
  "dist/styles.css",
  "dist/main.js",
  "dist/site-data.json",
  "dist/robots.txt",
  "dist/sitemap.xml",
  "dist/assets/hero-system.png",
  "dist/assets/微信二维码_李凯_IMG_9523.JPG",
  "dist/assets/公众号二维码_李凯思考笔记_IMG_9524.JPG",
  "dist/assets/李凯_个人主视觉.png",
  "dist/assets/logos/zju-official.png",
  "dist/assets/logos/linping-innovation-alliance.png",
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
if (data.meta?.sourceRoot || serialized.includes("/Users/")) {
  console.error("公开数据中不应包含本地文件路径");
  process.exit(1);
}

if ((data.insights || []).some((item) => !/^https?:\/\//.test(item.url || ""))) {
  console.error("思想与洞察中存在无效公开链接");
  process.exit(1);
}
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

const stickers = data.stickers || [];
if (stickers.length > 10 || new Set(stickers).size !== stickers.length) {
  console.error("首页近期观点图片必须不超过 10 张且不能重复");
  process.exit(1);
}

const requiredPracticeTitles = [
  "同时理解五种业务语言",
  "从管理者回到真实问题现场",
  "用三步把 AI 放进业务",
  "AI 赋能产业招商",
  "AI 赋能园区运营",
  "AI 赋能产业研究",
];
const practiceTitles = new Set(
  (data.practice || []).map((item) => item.title),
);
const missingPracticeTitles = requiredPracticeTitles.filter(
  (title) => !practiceTitles.has(title),
);

if (data.cooperation?.plans?.length !== 4 || missingPracticeTitles.length) {
  console.error("合作方案或实践方法内容不完整");
  missingPracticeTitles.forEach((title) => console.error(`- 缺少：${title}`));
  process.exit(1);
}

console.log("网站检查通过");
console.log(`主标题：${data.hero.title}`);
console.log(`课程数量：${data.courses.length}`);
console.log(`合作方案：${data.cooperation.plans.length}`);
