(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("workbench-locked");

  var style = document.createElement("style");
  style.textContent = [
    "html.workbench-locked body > *:not(#workbench-auth) { visibility: hidden; }",
    "#workbench-auth { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; padding: 24px; background: #f5f5f7; color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif; }",
    "#workbench-auth .auth-panel { width: min(420px, 100%); padding: 28px; background: #fff; border: 1px solid #e5e5ea; border-radius: 8px; box-shadow: 0 10px 28px rgba(0,0,0,.10); }",
    "#workbench-auth h1 { margin: 0; font-size: 22px; font-weight: 600; }",
    "#workbench-auth p { margin: 8px 0 20px; color: #6e6e73; font-size: 14px; line-height: 1.6; }",
    "#workbench-auth form { display: grid; gap: 12px; }",
    "#workbench-auth input { width: 100%; padding: 12px 13px; border: 1px solid #c7c7cc; border-radius: 6px; font: inherit; font-size: 16px; }",
    "#workbench-auth button { padding: 12px 14px; border: 0; border-radius: 6px; background: #1d1d1f; color: #fff; font: inherit; cursor: pointer; }",
    "#workbench-auth button:disabled { opacity: .6; cursor: wait; }",
    "#workbench-auth .auth-error { min-height: 20px; margin: 0; color: #b42318; font-size: 13px; }",
    ".workbench-readonly-note { margin: 10px 0 0; color: #6e6e73; font-size: 12px; }",
    "a.open-link[aria-disabled='true'] { cursor: default; opacity: .58; }",
  ].join("");
  document.head.appendChild(style);

  function base64ToBytes(value) {
    var binary = atob(value);
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  async function decryptPayload(payload, password) {
    var keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    var key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: base64ToBytes(payload.salt),
        iterations: payload.iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );
    var ciphertext = base64ToBytes(payload.ciphertext);
    var tag = base64ToBytes(payload.tag);
    var combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext, 0);
    combined.set(tag, ciphertext.length);
    var plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(payload.iv), tagLength: 128 },
      key,
      combined,
    );
    return JSON.parse(new TextDecoder().decode(plain));
  }

  function disableObsidianLinks(data) {
    document.querySelectorAll("a.open-link").forEach(function (link) {
      link.href = "#";
      link.setAttribute("aria-disabled", "true");
      link.addEventListener("click", function (event) {
        event.preventDefault();
      });
      link.textContent = "仅供查看";
    });
    var note = document.createElement("p");
    note.className = "workbench-readonly-note";
    note.textContent = "手机端为只读快照；项目原文和正式修改仍保留在 Mac mini 的 MAXNOTE 中。";
    var masthead = document.querySelector(".masthead");
    if (masthead) masthead.appendChild(note);
    document.title = "李凯项目办公室工作台｜只读";
    void data;
  }

  function mount() {
    var overlay = document.createElement("section");
    overlay.id = "workbench-auth";
    overlay.innerHTML = [
      '<div class="auth-panel">',
      "<h1>项目办公室工作台</h1>",
      "<p>这是只读查看入口。请输入工作台密码，查看 Mac mini 最近同步的项目状态快照。</p>",
      '<form autocomplete="off">',
      '<label for="workbench-password">登录密码</label>',
      '<input id="workbench-password" type="password" minlength="8" required autofocus>',
      '<p class="auth-error" role="alert"></p>',
      '<button type="submit">进入工作台</button>',
      "</form>",
      "</div>",
    ].join("");
    document.body.appendChild(overlay);

    var form = overlay.querySelector("form");
    var input = overlay.querySelector("input");
    var error = overlay.querySelector(".auth-error");
    var button = overlay.querySelector("button");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      error.textContent = "";
      button.disabled = true;
      try {
        var response = await fetch("data.enc.json", { cache: "no-store" });
        if (!response.ok) throw new Error("工作台数据暂未发布。");
        var payload = await response.json();
        window.PROJECT_WORKBENCH_DATA = await decryptPayload(payload, input.value);
        root.classList.remove("workbench-locked");
        overlay.remove();
        if (typeof window.renderWorkbench === "function") {
          window.renderWorkbench();
          disableObsidianLinks(window.PROJECT_WORKBENCH_DATA);
        }
      } catch {
        error.textContent = "密码不正确，或工作台数据尚未更新。";
        input.select();
      } finally {
        button.disabled = false;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", mount);
}());
