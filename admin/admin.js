const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "操作失败");
  return payload;
}

function formatTime(value) {
  if (!value) return "尚未同步";
  return new Date(value).toLocaleString("zh-CN");
}

function render(status) {
  $("#content-root").textContent = status.config.contentRoot;
  $("#repo-status").textContent = status.git.remote
    ? `${status.git.branch || "main"} / ${status.git.remote}`
    : "未配置远程仓库";
  $("#sync-time").textContent = formatTime(status.syncedAt);
  $("#publish-status").textContent = status.publishReady
    ? "可发布"
    : "等待配置远程仓库";
  $("#setting-source").textContent = status.config.contentRoot;
  $("#setting-remote").textContent = status.git.remote || "尚未配置";
  $("#setting-preview").href = status.previewUrl;
  $("#log-output").textContent = status.logs || "暂无日志";
}

async function refresh() {
  const status = await api("/api/status");
  render(status);
}

async function runAction(action) {
  $("#busy-note").textContent = "正在执行...";
  $$("button[data-action]").forEach((button) => (button.disabled = true));
  try {
    const status = await api(`/api/${action}`, { method: "POST" });
    render(status);
  } catch (error) {
    await refresh();
    alert(error.message);
  } finally {
    $("#busy-note").textContent = "空闲";
    $$("button[data-action]").forEach((button) => (button.disabled = false));
  }
}

$("#refresh").addEventListener("click", refresh);
$$("button[data-action]").forEach((button) => {
  button.addEventListener("click", () => runAction(button.dataset.action));
});

refresh();
setInterval(refresh, 5000);
