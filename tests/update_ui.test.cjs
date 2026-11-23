const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const assert = require("node:assert/strict");

const html = readFileSync(join(__dirname, "../ui/index.html"), "utf8");
const program = html.split("// TOOTOO_UPDATE_UI_START\n")[1].split("// TOOTOO_UPDATE_UI_END")[0];
const ids = [
  "updateNoticeBtn", "updateNoticeLabel", "updateCfg", "updateHeading",
  "updateCurrent", "updateStatus", "updateProgress", "updateNotes",
  "updateActionBtn", "updateReleaseLink", "settingsBtn",
];

function harness(native = true) {
  const actions = [], requests = [], routes = [];
  const classes = new Map(), attributes = new Map();
  const ui = Object.fromEntries(ids.map((id) => [id, {
    events: {},
    hidden: ["updateNoticeBtn", "updateNotes", "updateProgress"].includes(id),
    classList: { toggle(name, enabled) { classes.set(id + ":" + name, enabled); } },
    setAttribute(name, value) { attributes.set(id + ":" + name, value); },
    set innerHTML(_) { throw new Error("unsafe HTML write"); },
    removeAttribute(name) { delete this[name]; },
    addEventListener(name, fn) { this.events[name] = fn; },
    focus() { routes.push(id); },
    scrollIntoView() { routes.push(id); },
  }]));
  const window = native ? { webkit: { messageHandlers: { tootoo: {} } } } : {};
  vm.runInNewContext(program, {
    window,
    document: { getElementById: (id) => ui[id] },
    postNative: (...args) => { actions.push(args); return native; },
    fetch(url, opts) {
      return new Promise((resolve) => requests.push({
        url, opts, reply: (value, ok = true) => resolve({ ok, json: async () => value }),
      }));
    },
    requestAnimationFrame: (fn) => fn(),
    openSettingsModal: () => routes.push("settings"),
  });
  return { window, ui, actions, requests, routes, classes, attributes };
}

const available = {
  status: "available", currentVersion: "0.2.4", latestVersion: "v0.2.5",
  notes: '<img src=x onerror="alert(1)">', canInstall: true,
};
const settled = () => new Promise((resolve) => setImmediate(resolve));

test("hidden until a candidate exists; footer remains before Keep Awake and outside simple-mode hiding", () => {
  assert.match(html, /id="updateNoticeBtn" hidden[^\n]*\n\s*<button[^\n]+id="keepAwakeBtn"/);
  assert.match(html, /#updateNoticeBtn\[hidden\] \{ display: none !important; \}/);
  assert.doesNotMatch(html, /minimal-mode[^\n{]*(?:#updateNoticeBtn|\.pop-footer|\.footer-actions)/);
  assert.match(html, /id="keepAwakeCfg"[\s\S]+?<\/section>\s+<section[^>]+id="updateCfg"/);
  const { window, ui, actions } = harness();
  assert.equal(ui.updateNoticeBtn.hidden, true);
  assert.deepEqual(actions, [["getUpdateState"]]);
  window.__onUpdateState({ status: "constructor" });
  assert.equal(ui.updateNoticeBtn.hidden, true);
  window.__onUpdateState(available);
  assert.equal(ui.updateNoticeBtn.hidden, false);
  assert.equal(ui.updateNoticeLabel.textContent, "有新版本 v0.2.5");
  assert.equal(ui.updateCurrent.textContent, "当前版本：v0.2.4");
  assert.equal(ui.updateNotes.textContent, available.notes);
  window.__onUpdateState({ ...available, status: "current" });
  assert.equal(ui.updateNoticeBtn.hidden, true);
  assert.equal(ui.updateActionBtn.textContent, "检查更新");
});

test("native menu and footer jump to the same update section; only the native bridge opens the Release page", () => {
  const { window, ui, routes, actions } = harness();
  window.__openUpdateSettings();
  ui.updateNoticeBtn.events.click();
  assert.deepEqual(routes, ["settings", "updateHeading", "updateCfg", "settings", "updateHeading", "updateCfg"]);
  let prevented = false;
  ui.updateReleaseLink.events.click({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.deepEqual(actions.at(-1), ["openUpdateRelease"]);
  assert.match(html, /id="updateReleaseLink" href="https:\/\/github\.com\/uuuyuqi\/tootoo\/releases\/latest"/);
});

test("capability gates install, progress disables the action, and a safe error can be retried", () => {
  const { window, ui, actions } = harness();
  window.__onUpdateState({ ...available, canInstall: false });
  ui.updateActionBtn.events.click();
  assert.deepEqual(actions.at(-1), ["checkForUpdate"]);
  assert.match(ui.updateStatus.textContent, /请从 Release/);
  window.__onUpdateState(available);
  ui.updateActionBtn.events.click();
  assert.deepEqual(actions.at(-1), ["installUpdate"]);
  for (const status of ["downloading", "verifying", "installing"]) {
    window.__onUpdateState({ ...available, status, progress: 200 });
    assert.equal(ui.updateProgress.hidden, false);
    assert.equal(ui.updateProgress.value, status === "downloading" ? 100 : undefined);
    assert.equal(ui.updateActionBtn.disabled, true);
    const before = actions.length;
    ui.updateActionBtn.events.click();
    assert.equal(actions.length, before);
  }
  window.__onUpdateState({ ...available, status: "error", error: "<svg onload=bad()>" });
  assert.match(ui.updateStatus.textContent, /<svg onload=bad\(\)>/);
  assert.equal(ui.updateProgress.hidden, true);
  assert.equal(ui.updateActionBtn.disabled, false);
  assert.equal(ui.updateActionBtn.textContent, "一键下载并更新");
  window.__onUpdateState({ ...available, latestVersion: "https://evil.invalid" });
  assert.equal(ui.updateNoticeBtn.hidden, true);
  ui.updateActionBtn.events.click();
  assert.deepEqual(actions.at(-1), ["checkForUpdate"]);
});

test("browser uses GET only, ignores native callbacks, and ignores late old responses", async () => {
  const { window, ui, requests, actions } = harness(false);
  window.__onUpdateState(available);
  assert.equal(ui.updateNoticeBtn.hidden, true);
  assert.deepEqual(requests.map((r) => [r.url, r.opts.method]), [["/api/update", "GET"]]);
  ui.updateActionBtn.events.click();
  assert.equal(ui.updateActionBtn.disabled, true);
  assert.deepEqual(requests.map((r) => [r.url, r.opts.method]), [
    ["/api/update", "GET"], ["/api/update?force=1", "GET"],
  ]);
  requests[1].reply(available);
  await settled();
  assert.equal(ui.updateNoticeBtn.hidden, false);
  assert.equal(ui.updateActionBtn.textContent, "检查更新");
  requests[0].reply({ status: "current" });
  await settled();
  assert.equal(ui.updateNoticeBtn.hidden, false);
  ui.updateActionBtn.events.click();
  requests[2].reply({}, false);
  await settled();
  assert.match(ui.updateStatus.textContent, /更新失败/);
  assert.equal(ui.updateActionBtn.disabled, false);
  assert.deepEqual(actions, []);
});


test("settings gear stays in place and labels a known update without changing its click action", () => {
  assert.match(html, /id="settingsBtn" title="设置" aria-label="设置"/);
  assert.match(html, /#settingsBtn\.update-available::after\s*\{[^}]+position: absolute;[^}]+pointer-events: none;/);
  assert.doesNotMatch(html, /minimal-mode[^\n{]*(?:#settingsBtn|\.pop-footer|\.footer-actions)/);
  assert.match(html, /getElementById\("settingsBtn"\)\.addEventListener\("click", openSettingsModal\)/);

  const { window, ui, classes, attributes, actions } = harness();
  const marked = () => classes.get("settingsBtn:update-available");
  const title = () => ui.settingsBtn.title;
  const aria = () => attributes.get("settingsBtn:aria-label");
  window.__onUpdateState({ status: "idle" });
  assert.equal(marked(), false);
  assert.equal(aria(), "设置");
  window.__onUpdateState({ status: "error", latestVersion: "v99.0.0" });
  assert.equal(marked(), false);
  window.__onUpdateState(available);
  assert.equal(marked(), true);
  assert.equal(title(), "设置 · 有新版本 v0.2.5");
  assert.equal(aria(), title());

  for (const status of ["checking", "error", "downloading", "verifying", "installing"]) {
    window.__onUpdateState({ status });
    assert.equal(title(), "设置 · 有新版本 v0.2.5", status);
  }
  window.__onUpdateState({ ...available, status: "current" });
  assert.equal(marked(), false);
  assert.equal(title(), "设置");
  assert.equal(aria(), title());
  window.__onUpdateState({ ...available, latestVersion: "<img>" });
  assert.equal(marked(), false);
  assert.deepEqual(actions, [["getUpdateState"]]);
});

test("failed browser refresh does not erase the last known gear update", async () => {
  const { ui, classes, requests } = harness(false);
  requests[0].reply(available);
  await settled();
  ui.updateActionBtn.events.click();
  assert.equal(classes.get("settingsBtn:update-available"), true);
  requests[1].reply({}, false);
  await settled();
  assert.equal(classes.get("settingsBtn:update-available"), true);
  ui.updateActionBtn.events.click();
  requests[2].reply({ status: "current" });
  await settled();
  assert.equal(classes.get("settingsBtn:update-available"), false);
});
