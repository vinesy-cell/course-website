const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

// 先转义，再对关键词加高亮标记（安全：HTML已转义后才插入span）
const highlight = (text) =>
  escapeHtml(text)
    .replace(/\bAI\b/g, '<span class="kw">AI</span>')
    .replace(/浙江大学/g, '<span class="kw">浙江大学</span>')
    .replace(/副总裁/g, '<span class="kw">副总裁</span>')
    .replace(/MBA/g, '<span class="kw">MBA</span>')
    .replace(/19年/g, '<span class="kw">19年</span>');

const list = (items = []) =>
  `<ul class="clean-list">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;

const sectionHeader = (label, title, intro = "") => `
  <p class="section-label">${escapeHtml(label)}</p>
  <h2 class="section-title">${escapeHtml(title)}</h2>
  ${intro ? `<p class="section-intro">${escapeHtml(intro)}</p>` : ""}
`;

const navigationTargets = {
  课程方案: "#topics",
  场景工作坊: "#delivery",
  合作方式: "#cooperation",
  讲师介绍: "#instructor",
  思想与洞察: "#insights",
  联系: "#contact",
};

async function loadData() {
  const response = await fetch("./site-data.json", { cache: "no-store" });
  if (!response.ok) throw new Error("无法读取网站内容数据");
  return response.json();
}

function renderNavigation(data) {
  const nav = document.querySelector(".site-nav");
  nav.innerHTML = data.navigation
    .map(
      (item) =>
        `<a href="${navigationTargets[item] || "#top"}">${escapeHtml(item)}</a>`,
    )
    .join("");
}

function renderHero(data) {
  const hero = document.querySelector(".hero-copy");
  const visual = document.querySelector(".hero-visual");
  const actions = data.hero.actions.length
    ? data.hero.actions
    : ["发来3个真实问题", "了解课程方案"];
  hero.innerHTML = `
    <h1>${data.hero.title.split("\n").map(escapeHtml).join("<br>")}</h1>
    <p class="hero-subtitle">${escapeHtml(data.hero.subtitle)}</p>
    <p class="hero-instructor">${escapeHtml(data.hero.instructor)}</p>
    <div class="hero-actions">
      <a class="button" href="#contact">${escapeHtml(actions[1] || actions[0])}</a>
      <a class="button secondary" href="#courses">${escapeHtml(actions[0])}</a>
    </div>
  `;

  // 若有本周贴图，用横向慢速滚动带替换 hero 静态图
  if (data.stickers && data.stickers.length > 0) {
    visual.classList.add("sticker-mode");
    const items = data.stickers
      .map(
        (f) =>
          `<img src="./assets/stickers/${encodeURIComponent(f)}" alt="公众号配图" loading="lazy" />`,
      )
      .join("");
    // 复制一组实现无缝循环
    visual.innerHTML = `<div class="sticker-track-wrap"><div class="sticker-track">${items}${items}</div></div>`;
  }
}

function renderPain(data) {
  const section = document.querySelector("#pain");
  section.innerHTML = `
    ${sectionHeader("01 / 为什么现在需要", "AI 不缺工具，缺的是进入真实任务的路径", data.pain.intro)}
    <div class="pain-list">
      ${data.pain.items
        .map(
          (item, index) => `
            <div class="pain-item">
              <span class="pain-number">${String(index + 1).padStart(2, "0")}</span>
              <span>${escapeHtml(item)}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderCourseCatalog(data) {
  const section = document.querySelector("#topics");
  if (!data.catalog || data.catalog.length === 0) {
    section.hidden = true;
    return;
  }
  section.innerHTML = `
    ${sectionHeader("02 / 课程全景", "从认知建立到场景落地，按业务方向选择适合的课程")}
    <div class="catalog-grid">
      ${data.catalog
        .map(
          (cat) => `
            <div class="catalog-card catalog-card--${escapeHtml(cat.color)}">
              <p class="catalog-category">${escapeHtml(cat.name)}篇</p>
              <ul class="catalog-list">
                ${cat.courses.map((c) => `<li>《${escapeHtml(c)}》</li>`).join("")}
              </ul>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderCourses(data) {
  const section = document.querySelector("#courses");
  const header = `<p class="courses-sublabel">精选展开 · 适合对象 · 交付成果</p>`;
  section.innerHTML = header + data.courses
    .map(
      (course, index) => `
        <article class="course-block" data-reveal>
          <div>
            <span class="course-index">${String(index + 1).padStart(2, "0")}</span>
            ${course.category ? `<span class="insight-tag insight-tag--${escapeHtml(course.categoryColor)}">${escapeHtml(course.category)}</span>` : ""}
            <h3>《${escapeHtml(course.title)}》</h3>
            <p>${escapeHtml(course.description)}</p>
          </div>
          <div class="course-details">
            <div class="detail-group">
              <h4>适合谁</h4>
              ${list(course.audience)}
            </div>
            <div class="detail-group">
              <h4>能带走什么</h4>
              ${list(course.outcomes)}
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderDelivery(data) {
  const section = document.querySelector("#delivery");
  section.innerHTML = `
    ${sectionHeader("03 / 交付方式", "不止讲完一堂课，更要留下可执行的成果")}
    <div class="delivery-grid">
      <div class="delivery-steps">
        ${data.delivery.formats
          .map((item, index) => {
            const sep = item.indexOf("：");
            const name = sep > -1 ? item.slice(0, sep) : item;
            const desc = sep > -1 ? item.slice(sep + 1) : "";
            return `
              <div class="delivery-step">
                <span>${String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong class="delivery-format-name">${escapeHtml(name)}</strong>
                  ${desc ? `<p class="delivery-format-desc">${escapeHtml(desc)}</p>` : ""}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
      <div class="delivery-table">
        ${data.delivery.content
          .map(
            (item) => `
              <div class="delivery-row">
                <strong>${escapeHtml(item["形式"])}</strong>
                <span>${escapeHtml(item["可开展内容"])}</span>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderCooperation(data) {
  const section = document.querySelector("#cooperation");
  section.innerHTML = `
    ${sectionHeader("04 / 合作方式", "从诊断建立判断，到工作坊形成行动", data.cooperation.intro)}
    <div class="plan-list">
      ${data.cooperation.plans
        .map(
          (plan) => `
            <article class="plan">
              <p class="plan-level">${escapeHtml(plan.level || "按场景定制")}</p>
              <h3>${escapeHtml(plan.title)}</h3>
              ${data.meta.publicPrices && plan.price ? `<p class="plan-price">${escapeHtml(plan.price)}</p>` : ""}
              <p class="plan-description">${escapeHtml(plan.description)}</p>
              ${list(plan.includes)}
              <a class="button" href="#contact">带着真实问题沟通</a>
            </article>
          `,
        )
        .join("")}
    </div>
    <p class="upgrade-note">可选升级：${escapeHtml(data.cooperation.upgrades.join("；"))}</p>
  `;
}

function renderInstructor(data) {
  const section = document.querySelector("#instructor");
  section.innerHTML = `
    <div class="instructor-copy">
      ${sectionHeader("05 / 讲师介绍", "从园区与组织实践出发，让 AI 进入业务现场")}
      ${data.instructor.paragraphs.map((item) => `<p>${highlight(item)}</p>`).join("")}
      <p class="instructor-research">${escapeHtml(data.instructor.research)}</p>
      <p class="credentials-label">部分认证与专业背书</p>
      <ul class="credential-list">
        ${data.instructor.credentials
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join("")}
      </ul>
    </div>
    <figure class="poster-frame">
      <img src="./assets/${encodeURIComponent(data.assets.coursePoster)}" alt="李凯讲师海报" />
    </figure>
  `;
}

function renderInsights(data) {
  const section = document.querySelector("#insights");
  if (!data.insights || data.insights.length === 0) {
    section.hidden = true;
    return;
  }
  section.innerHTML = `
    ${sectionHeader("06 / 思想与洞察", "产业园区与 AI 落地的持续研究与观察")}
    <div class="insight-grid">
      ${data.insights
        .map(
          (item) => `
            <a class="insight-card" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">
              <div class="insight-meta">
                <span class="insight-tag insight-tag--${escapeHtml(item.color)}">${escapeHtml(item.category)}</span>
                <span class="insight-date">${escapeHtml(item.date)}</span>
              </div>
              <h3>${escapeHtml(item.title)}</h3>
              ${item.excerpt ? `<p>${escapeHtml(item.excerpt)}</p>` : ""}
              <span class="insight-read">阅读全文 →</span>
            </a>
          `,
        )
        .join("")}
    </div>
    <p class="insight-follow">
      更多内容见公众号
      <strong>「李凯思考笔记」</strong>
    </p>
  `;
}

function renderContact(data) {
  const section = document.querySelector("#contact");
  section.innerHTML = `
    <div class="contact-layout">
      <div>
        ${sectionHeader("07 / 联系", "先把一个真实问题说清楚")}
        <p>${escapeHtml(data.conversion.paragraphs[0] || "")}</p>
        <div class="contact-links">
          <a href="tel:${escapeHtml(data.contacts.phone)}"><span>电话</span><strong>${escapeHtml(data.contacts.phone)}</strong></a>
          <a href="mailto:${escapeHtml(data.contacts.email)}"><span>邮箱</span><strong>${escapeHtml(data.contacts.email)}</strong></a>
        </div>
      </div>
      <div class="qr-grid">
        <div class="qr-card">
          <img src="./assets/${encodeURIComponent(data.assets.wechatQr)}" alt="添加李凯微信二维码" />
          <span>扫码添加李凯微信</span>
        </div>
        <div class="qr-card">
          <img src="./assets/${encodeURIComponent(data.assets.accountQr)}" alt="李凯思考笔记公众号二维码" />
          <span>关注「李凯思考笔记」</span>
        </div>
      </div>
    </div>
  `;
}

function setupInteractions() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
}

async function main() {
  const data = await loadData();
  document.title = `${data.meta.siteName}｜${data.meta.title}`;
  renderNavigation(data);
  renderHero(data);
  renderPain(data);
  renderCourseCatalog(data);
  renderCourses(data);
  renderDelivery(data);
  renderCooperation(data);
  renderInstructor(data);
  renderInsights(data);
  renderContact(data);
  document.querySelector("#sync-note").textContent =
    `内容更新时间：${new Date(data.meta.syncedAt).toLocaleString("zh-CN")}`;
  setupInteractions();
}

main().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<main class="section-shell"><h1>网站内容加载失败</h1><p>${escapeHtml(error.message)}</p></main>`;
});
