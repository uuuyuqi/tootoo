const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const html = readFileSync(join(__dirname, "../ui/index.html"), "utf8");
const source = html.slice(html.indexOf("function formatFactoryCredits"), html.indexOf("let lastSeenCallTs"));

function harness(quota, credits = 92300) {
  const elements = new Map(), writes = [];
  const windowButtons = [5, 24, 168, 720].map(win => element({ win }));
  const unitButtons = ["tokens", "cost"].map(unit => element({ unit }));
  let fail = false, refreshed = 0, editButton;
  function element(dataset = {}) {
    const classes = new Set();
    return {
      dataset, classes, style: {},
      classList: {
        add: c => classes.add(c),
        remove: c => classes.delete(c),
        toggle: (c, on) => on ? classes.add(c) : classes.delete(c),
      },
      addEventListener(type, fn) { this[type] = fn; },
      querySelectorAll: sel => sel === ".quota-edit-btn" && editButton ? [editButton] : [],
    };
  }
  const doc = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    querySelectorAll: sel => sel.includes("qcfgWinSeg") ? windowButtons : unitButtons,
  };
  const tool = { tool: "droid", label: "Factory Droid", tokens: 20, cache_hit: 0, credits, quota };
  const d = { tools: [tool], kpi: { tokens: 20 } };
  const scope = vm.createContext({
    document: doc, state: { data: d }, d,
    esc: s => String(s).replaceAll("<", "&lt;"), fmtNum: String, fmtCostRich: String, splitNumUnit: String,
    fetch: async (path, req) => {
      assert.equal(path, "/api/quota/config");
      writes.push(JSON.parse(req.body));
      return { ok: !fail, json: async () => ({ ok: !fail }) };
    },
    fetchTelemetry: () => { refreshed++; },
  });
  editButton = element({ qtool: "droid", qlabel: "Factory 积分", qparent: "droid" });
  vm.runInContext(source + "\nrenderAgents(d);", scope);
  return {
    el: doc.getElementById, writes, windowButtons, editButton,
    refreshes: () => refreshed, failRequest: () => { fail = true; },
  };
}
function budget(percentage = 76, limit = 20_000_000) {
  return {
    source: "local_custom", unit: "credits", is_custom: true, window_hours: 720,
    used_value: limit * percentage / 100, limit_value: limit, used_percent: percentage,
  };
}

test("Droid card only shows locally spent credits by default, in both layouts", () => {
  const { el } = harness(null);
  for (const target of ["agentList", "agentListPop"]) {
    const card = el(target).innerHTML;
    assert.match(card, /Factory 积分 · 已耗 92\.3K/);
    assert.match(card, /纯本地读取 ~\/\.factory\/sessions，不读凭证/);
    assert.match(card, />设上限<\/button>/);
    assert.doesNotMatch(card, /role="progressbar"|剩 \d+%/);
  }
  assert.doesNotMatch(harness(null, 0).el("agentList").innerHTML, /Factory 积分/);
  assert.match(harness(null, 0.125).el("agentList").innerHTML, /已耗 0\.125/);
});

test("manual budget shows a separate rolling amount and a bounded remaining bar", () => {
  for (const [percent, remaining, color] of [[0, 100, "teal"], [76, 24, "warn"], [115, 0, "bad"]]) {
    const card = harness(budget(percent), 0).el("agentList").innerHTML;
    assert.match(card, /Factory 积分 · 已耗 0/);
    assert.match(card, /预算（30天）/);
    assert.match(card, /不是 Factory 套餐额度/);
    assert.match(card, new RegExp(`aria-valuenow="${remaining}"`));
    assert.ok(card.includes(`background:var(--${color})`));
    assert.match(card, /已用 .* \/ 20M/);
    assert.match(card, />编辑<\/button>/);
  }
});

test("Droid setup defaults to rolling 24h, saves raw credits, and clears config", async () => {
  const { el, writes, windowButtons, editButton, refreshes } = harness(null);
  editButton.click({ stopPropagation() {} });
  assert(el("quotaModal").classes.has("open"));
  assert(windowButtons.find(b => b.dataset.win === 24).classes.has("active"));
  assert(!windowButtons.find(b => b.dataset.win === 720).hidden);
  assert(el("qcfgUnitRow").hidden);
  assert.equal(el("qcfgResetBtn").textContent, "清除上限");
  el("qcfgLimitInput").value = "0";
  await el("qcfgSaveBtn").click();
  assert.equal(writes.length, 0);
  assert(!el("qcfgError").hidden);
  assert(el("quotaModal").classes.has("open"));
  windowButtons.find(b => b.dataset.win === 720).click();
  el("qcfgLimitInput").value = "20000000";
  await el("qcfgSaveBtn").click();
  assert.deepEqual(writes[0], { tool: "droid", unit: "credits", limit: 20_000_000, window_hours: 720 });
  assert(!el("quotaModal").classes.has("open"));
  editButton.click({ stopPropagation() {} });
  await el("qcfgResetBtn").click();
  assert.deepEqual(writes[1], { tool: "droid", reset: true });
  assert.equal(refreshes(), 2);
});

test("editing preserves exact limit and errors don't close the modal", async () => {
  const h = harness(budget(25, 910223.125));
  const { el, windowButtons } = h;
  h.editButton.click({ stopPropagation() {} });
  assert.equal(el("qcfgLimitInput").value, "910223.125");
  assert(windowButtons.find(b => b.dataset.win === 720).classes.has("active"));
  h.failRequest();
  await el("qcfgResetBtn").click();
  assert(el("quotaModal").classes.has("open"));
  assert(!el("qcfgError").hidden);
  assert.equal(h.refreshes(), 0);
});
