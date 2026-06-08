const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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
  课程方案: "#courses",
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
  const actions = data.hero.actions.length
    ? data.hero.actions
    : ["发来3个真实问题", "了解课程方案"];
  hero.innerHTML = `
    <h1>${escapeHtml(data.hero.title)}</h1>
    <p class="hero-subtitle">${escapeHtml(data.hero.subtitle)}</p>
    <p class="hero-instructor">${escapeHtml(data.hero.instructor)}</p>
    <div class="hero-actions">
      <a class="button" href="#contact">${escapeHtml(actions[1] || actions[0])}</a>
      <a class="button secondary" href="#courses">${escapeHtml(actions[0])}</a>
    </div>
  `;
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

function renderRecommendations(data) {
  const section = document.querySelector("#topics");
  section.innerHTML = `
    ${sectionHeader("02 / 推荐主题", "从趋势判断，到产业与组织行动")}
    <div class="recommendation-list">
      ${data.recommendations
        .map(
          (item) => `
            <article class="recommendation-item">
              <h3>${escapeHtml(item["主题"])}</h3>
              <p>${escapeHtml(item["价值表达"])}</p>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderCourses(data) {
  const section = document.querySelector("#courses");
  section.innerHTML = data.courses
    .map(
      (course, index) => `
        <article class="course-block" data-reveal>
          <div>
            <span class="course-index">${String(index + 1).padStart(2, "0")}</span>
            <h3>${escapeHtml(course.title)}</h3>
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
          .map(
            (item, index) => `
              <div class="delivery-step">
                <span>${String(index + 1).padStart(2, "0")}</span>
                <div>${escapeHtml(item)}</div>
              </div>
            `,
          )
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
      ${sectionHeader("06 / 讲师介绍", "从园区与组织实践出发，让 AI 进入业务现场")}
      ${data.instructor.paragraphs.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
      <p>${escapeHtml(data.instructor.research)}</p>
      <ul class="credential-list">
        ${data.instructor.credentials
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join("")}
      </ul>
    </div>
    <figure class="poster-frame">
      <img src="./assets/${encodeURIComponent(data.assets.coursePoster)}" alt="李凯课程介绍海报" />
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
        ${sectionHeader("08 / 联系", "先把一个真实问题说清楚")}
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
          <span>关注“李凯思考笔记”</span>
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
  renderRecommendations(data);
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
