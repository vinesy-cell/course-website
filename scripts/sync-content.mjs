import fs from "node:fs";
import path from "node:path";
import {
  bullets,
  childHeadings,
  cleanInline,
  findHeading,
  firstParagraph,
  labeledList,
  paragraphs,
  readDocument,
  sectionLines,
  table,
} from "./lib/markdown.mjs";
import {
  ensureDirectory,
  nowIso,
  projectRoot,
  readConfig,
  writeJson,
} from "./lib/config.mjs";

const config = readConfig();
const source = (...segments) => path.join(config.contentRoot, ...segments);
const requiredFiles = {
  decisions: source("00_项目管理", "01_当前状态与决策清单.md"),
  homepage: source("02_网站结构与文案", "02_首页内容骨架.md"),
  contacts: source("01_网站资料清单", "02_公开联系方式与二维码.md"),
};
const optionalFiles = {
  articles: source("01_网站资料清单", "04_公众号文章精选.md"),
  catalog: source("02_网站结构与文案", "04_课程分类与目录.md"),
};

for (const [name, filePath] of Object.entries(requiredFiles)) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`缺少内容源文件（${name}）：${filePath}`);
  }
}

const decisionsDoc = readDocument(requiredFiles.decisions);
const homepageDoc = readDocument(requiredFiles.homepage);
const contactsDoc = readDocument(requiredFiles.contacts);

const decisionHeading = findHeading(decisionsDoc, "已确定口径");
const pendingHeading = findHeading(decisionsDoc, "待确认决策与默认处理");
const decisions = Object.fromEntries(
  table(sectionLines(decisionsDoc, decisionHeading)).map((row) => [
    row["项目"],
    row["当前采用"],
  ]),
);
const pending = table(sectionLines(decisionsDoc, pendingHeading));

const heroParent = findHeading(homepageDoc, "首屏");
const heroValue = (title) => {
  const heading = findHeading(homepageDoc, title, { within: heroParent });
  return firstParagraph(homepageDoc, heading);
};
// H1 特殊处理：保留原始换行，让渲染层可以将每行显示为独立一行
const h1Heading = findHeading(homepageDoc, "H1", { within: heroParent });
const h1Title = sectionLines(homepageDoc, h1Heading)
  .filter((l) => l.trim() && !/^#{1,6}\s/.test(l.trim()))
  .join("\n") || heroValue("H1");

const painHeading = findHeading(homepageDoc, "痛点区");
const courseParent = findHeading(homepageDoc, "课程矩阵");
const recommendationHeading = findHeading(homepageDoc, "推荐主题", {
  within: courseParent,
});
// 课程分类颜色映射
const COURSE_CATEGORY_COLORS = {
  "企业经营": "brass",
  "产业园区": "blue",
  "办公效能": "muted",
  "技术进阶": "brass",
  "认知与趋势": "muted",
  "政企协同": "blue",
};

const courseTitles = [
  "AI驱动企业经营效率跃升",
  "AI重塑产业园区运营逻辑",
  "AI赋能企业办公倍速提效",
  "AI Agent智能体应用与搭建",
  "新质生产力与AI赋能创新",
  "AI赋能政企协同与产业服务",
];
const courses = courseTitles.map((title) => {
  const heading = findHeading(homepageDoc, title, { within: courseParent });
  const lines = sectionLines(homepageDoc, heading);
  const allParas = paragraphs(lines);
  const categoryPara = allParas.find((p) => /^分类[：:]/.test(p)) || "";
  const category = cleanInline(categoryPara.replace(/^分类[：:]\s*/, ""));
  return {
    title,
    description: allParas.find((p) => !/^分类[：:]/.test(p)) || "",
    category,
    categoryColor: COURSE_CATEGORY_COLORS[category] || "muted",
    audience: labeledList(lines, "适合"),
    outcomes: labeledList(lines, "带走"),
  };
});

const deliveryHeading = findHeading(homepageDoc, "交付方式");
const deliveryContentHeading = findHeading(homepageDoc, "可开展内容", {
  within: deliveryHeading,
});

const practiceParent = findHeading(homepageDoc, "实践方法与访谈观点");
const practice = practiceParent
  ? childHeadings(homepageDoc, practiceParent).map((heading) => ({
      title: heading.title,
      description: firstParagraph(homepageDoc, heading),
    }))
  : [];

const cooperationParent = findHeading(homepageDoc, "合作方案");
const cooperationTitles = [
  "AI产业场景诊断服务",
  "AI产业场景闭门研讨 / 专题内训",
  "AI场景落地行动工作坊",
  "CEO AI私教与内容陪跑",
];
const cooperation = cooperationTitles.map((title) => {
  const heading = findHeading(homepageDoc, title, { within: cooperationParent });
  const lines = sectionLines(homepageDoc, heading);
  const text = paragraphs(lines);
  const firstLine = cleanInline(text[0] || "");
  const commaIndex = firstLine.search(/[，,]/);
  const level = commaIndex >= 0 ? firstLine.slice(0, commaIndex) : firstLine;
  const price = commaIndex >= 0 ? firstLine.slice(commaIndex + 1).replace(/[。.]\s*$/, "").trim() : "";
  return {
    title,
    level,
    price,
    description:
      text.find(
        (paragraph) =>
          paragraph.startsWith("适合") && !paragraph.includes("¥"),
      ) || "",
    includes: labeledList(lines, "包含"),
  };
});

const upgradeHeading = findHeading(homepageDoc, "可选升级", {
  within: cooperationParent,
});
const instructorHeading = findHeading(homepageDoc, "讲师介绍");
const researchHeading = findHeading(homepageDoc, "研究方向", {
  within: instructorHeading,
});
const credentialsHeading = findHeading(homepageDoc, "部分认证与专业背书", {
  within: instructorHeading,
});
const trustHeading = findHeading(homepageDoc, "信任资产");
const valuesHeading = findHeading(homepageDoc, "价值表达");
const conversionHeading = findHeading(homepageDoc, "转化入口");

// 课程全景目录（可选文件）
let catalog = [];
if (fs.existsSync(optionalFiles.catalog)) {
  const catalogDoc = readDocument(optionalFiles.catalog);
  const catalogParent = findHeading(catalogDoc, "课程目录");
  if (catalogParent) {
    catalog = childHeadings(catalogDoc, catalogParent).map((heading) => {
      const categoryName = heading.title.replace(/篇$/, "");
      const rows = table(sectionLines(catalogDoc, heading));
      return {
        name: categoryName,
        color: COURSE_CATEGORY_COLORS[categoryName] || "muted",
        courses: rows
          .map((r) => cleanInline(r["课程名称"] || "").replace(/^《|》$/g, ""))
          .filter(Boolean),
      };
    });
  }
}

// 公众号文章（可选文件，缺失不报错）
const CATEGORY_COLORS = { "产业园区": "blue", "AI落地": "brass", "产业研究": "muted" };
let insights = [];
if (fs.existsSync(optionalFiles.articles)) {
  const articlesDoc = readDocument(optionalFiles.articles);
  const allRows = table(articlesDoc.lines || articlesDoc);
  insights = allRows
    .filter((row) => row["链接"] && row["链接"].trim() && row["链接"].trim() !== "（待填入）")
    .slice(0, 6)
    .map((row) => ({
      title: cleanInline(row["标题"] || ""),
      url: row["链接"].trim(),
      category: cleanInline(row["分类"] || ""),
      color: CATEGORY_COLORS[row["分类"]?.trim()] || "muted",
      date: cleanInline(row["日期"] || ""),
      excerpt: cleanInline(row["摘要"] || ""),
    }));
}

const contactHeading = findHeading(contactsDoc, "对外联系方式");
const contactRows = table(sectionLines(contactsDoc, contactHeading));
const contactMap = Object.fromEntries(
  contactRows.map((row) => [row["类型"], row["内容"]]),
);

const assets = {
  wechatQr: "微信二维码_李凯_IMG_9523.JPG",
  accountQr: "公众号二维码_李凯思考笔记_IMG_9524.JPG",
  coursePoster: "李凯_个人主视觉.png",
};

// 公众号贴图：扫描 05_视觉素材/公众号贴图/ 文件夹，取全部图片（按文件名排序）
const STICKER_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
const stickersDir = source("05_视觉素材", "公众号贴图");
const stickerFiles = fs.existsSync(stickersDir)
  ? fs.readdirSync(stickersDir)
      .filter((f) => STICKER_EXTS.has(path.extname(f).toLowerCase()))
      .sort()
  : [];

const siteData = {
  meta: {
    siteName: config.siteName,
    title: decisions["网站主标题"] || config.siteTitle,
    description: heroValue("副标题"),
    syncedAt: nowIso(),
    sourceRoot: config.contentRoot,
    publicPrices: Boolean(config.publicPrices),
  },
  navigation: ["课程方案", "场景工作坊", "实践方法", "合作方式", "讲师介绍", "思想与洞察", "联系"],
  hero: {
    title: h1Title,
    tagline: heroValue("顶部标语"),
    sceneLabel: heroValue("场景标签"),
    subtitle: heroValue("副标题"),
    instructor: heroValue("讲师简介短句"),
    actions: bullets(
      sectionLines(
        homepageDoc,
        findHeading(homepageDoc, "首屏按钮", { within: heroParent }),
      ),
    ),
  },
  pain: {
    intro: paragraphs(sectionLines(homepageDoc, painHeading))[0] || "",
    items: bullets(sectionLines(homepageDoc, painHeading)),
  },
  recommendations: table(sectionLines(homepageDoc, recommendationHeading)),
  courses,
  delivery: {
    formats: bullets(sectionLines(homepageDoc, deliveryHeading)),
    content: table(sectionLines(homepageDoc, deliveryContentHeading)),
  },
  cooperation: {
    intro: paragraphs(sectionLines(homepageDoc, cooperationParent))[0] || "",
    plans: cooperation,
    upgrades: bullets(sectionLines(homepageDoc, upgradeHeading)).map((item) =>
      item.replace(/：¥[\d,]+ 起，?/, "："),
    ),
  },
  instructor: {
    paragraphs: paragraphs(sectionLines(homepageDoc, instructorHeading)).slice(0, 3),
    research: firstParagraph(homepageDoc, researchHeading),
    credentials: bullets(sectionLines(homepageDoc, credentialsHeading)),
  },
  practice,
  trust: bullets(sectionLines(homepageDoc, trustHeading)).filter(
    (item) => !/(07|08)_课程网站\//.test(item),
  ),
  values: bullets(sectionLines(homepageDoc, valuesHeading)),
  conversion: {
    paragraphs: paragraphs(sectionLines(homepageDoc, conversionHeading)).slice(0, 2),
    options: bullets(sectionLines(homepageDoc, conversionHeading)),
  },
  contacts: {
    phone: contactMap["电话"] || "",
    email: contactMap["邮箱"] || "",
    wechat: contactMap["微信"] || "",
    account: contactMap["公众号"] || "",
  },
  catalog,
  insights,
  stickers: stickerFiles,
  decisions,
  pending,
  assets,
};

writeJson(path.join(projectRoot, "content", "site-data.json"), siteData);

const publicAssets = path.join(projectRoot, "public", "assets");
ensureDirectory(publicAssets);
for (const fileName of Object.values(assets)) {
  const from = source("05_视觉素材", fileName);
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, path.join(publicAssets, fileName));
  }
}

// 复制本周贴图到 public/assets/stickers/
if (stickerFiles.length > 0) {
  const stickersOut = path.join(projectRoot, "public", "assets", "stickers");
  ensureDirectory(stickersOut);
  for (const f of stickerFiles) {
    fs.copyFileSync(path.join(stickersDir, f), path.join(stickersOut, f));
  }
  console.log(`贴图已复制：${stickerFiles.length} 张`);
}

writeJson(path.join(projectRoot, ".last-sync.json"), {
  syncedAt: siteData.meta.syncedAt,
  sourceRoot: config.contentRoot,
  files: Object.values(requiredFiles),
  assetsCopied: Object.values(assets),
});

// ── 下载/生成背书机构 logo（本地缓存，不依赖外部服务）────────
const makeSvgBadge = (text, bg = "#243f50") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
  `<rect width="32" height="32" rx="5" fill="${bg}"/>` +
  `<text x="16" y="21" text-anchor="middle" dominant-baseline="middle" ` +
  `fill="white" font-family="PingFang SC,sans-serif" font-size="${text.length > 1 ? 11 : 16}" font-weight="700">${text}</text>` +
  `</svg>`;

const CREDENTIAL_LOGO_SOURCES = [
  { domain: "zucc.edu.cn",   ext: "svg", svgBadge: makeSvgBadge("城院", "#1a5c8a") },
  { domain: "zju.edu.cn",    ext: "svg", svgBadge: makeSvgBadge("浙大", "#003087") },
  { domain: "iflytek.com",   ext: "png", fetchUrl: `https://www.google.com/s2/favicons?domain=iflytek.com&sz=64` },
  { domain: "alibaba.com",   ext: "png", fetchUrl: `https://www.google.com/s2/favicons?domain=alibaba.com&sz=64` },
  { domain: "antgroup.com",  ext: "svg", fetchUrl: `https://cdn.simpleicons.org/antdesign/06AED4` },
  { domain: "sensetime.com", ext: "png", fetchUrl: `https://www.google.com/s2/favicons?domain=sensetime.com&sz=64` },
];
const logosDir = path.join(projectRoot, "public", "assets", "logos");
ensureDirectory(logosDir);
for (const { domain, ext, fetchUrl, svgBadge } of CREDENTIAL_LOGO_SOURCES) {
  const localFile = path.join(logosDir, `${domain}.${ext}`);
  if (fs.existsSync(localFile)) continue;
  if (svgBadge) {
    fs.writeFileSync(localFile, svgBadge, "utf8");
    console.log(`Logo 生成：${domain}`);
  } else if (fetchUrl) {
    try {
      const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(localFile, buf);
        console.log(`Logo 已下载：${domain}`);
      }
    } catch {
      // 网络不可用时跳过
    }
  }
}

console.log(`内容同步完成：${siteData.meta.syncedAt}`);
console.log(`内容源：${config.contentRoot}`);
