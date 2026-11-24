const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const html = readFileSync(join(__dirname, "../ui/index.html"), "utf8");
const catalog = readFileSync(join(__dirname, "../ui/tootoo_catalog.js"), "utf8");

function uiFunction(name) {
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, name);
  return html.slice(start, html.indexOf("\n}", start) + 2);
}

function harness() {
  const boostClasses = new Set();
  const nodes = {
    xpWrap: { closest: () => null, classList: { toggle(name, on) { if (on) boostClasses.add(name); else boostClasses.delete(name); } } },
    xpText: { removeAttribute(name) { delete this[name]; } },
    evoModal: { classList: { contains: key => key === "open" } },
    evoProgressBox: {},
    evoGrid: { querySelectorAll: () => [] },
    evoHint: {},
  };
  const writes = [];
  const scope = vm.createContext({
    document: { getElementById: id => nodes[id] },
    state: { data: { today_tokens: 565e6, evo_peak_tokens: 575e6 } },
    carrotDiskState: { home: { xp_boost: { day: "", tokens: 0 }, owned_wear: [], wear: {} } },
    debugState: { active: false, level: null, simTokens: null, homeSandbox: null, unlockAll: false },
    minimalMode: false,
    today: "2026-11-24",
    ephTokens: 0,
    evoProgTimer: null,
    homeUiState: { preview: null },
    localStorage: { getItem: () => null, setItem: (...args) => writes.push(["storage", ...args]) },
    cloneHomeState: structuredClone,
    getStarRankInfo: () => ({ active: false, stars: 0 }),
    getActiveSecretSkin: () => ({ id: "prism", label: "prism" }),
    getTierVisual: () => ({ stage: "", svg: "" }),
    getTierInteractHint: () => "",
    getActiveTierInnateSvg: () => "",
    isTierInnateVisible: () => true,
    isHomeSecretUnlocked: () => false,
    renderPriceHtml: () => "",

    requestAnimationFrame: () => {},
    setTimeout: () => 1,
    clearTimeout: () => {},
    renderGachaMeta: () => {},
    persistCarrotPatch: patch => writes.push(["carrot", patch]),
  });
  vm.runInContext(catalog, scope);
  scope.TOOTOO_REG = scope.TooTooRegistry;
  scope.HOME_GRADE_META = scope.TOOTOO_REG.economy.gradeMeta;
  const definitions = [["const BUNNY_TIERS = [", "\n];"], ["const TIER_INNATE_ACCESSORIES = {", "\n};"]]
    .map(([prefix, suffix]) => {
      const start = html.indexOf(prefix);
      assert.notEqual(start, -1, prefix);
      return html.slice(start, html.indexOf(suffix, start) + suffix.length);
    }).join("\n");
  vm.runInContext(definitions + "\n" + [
    "getBunnyTier", "getTodayXpBoostTokens", "getVisibleTodayXpBoostTokens", "formatXpBoostTokens",
    "renderTodayXpText", "fmtNum", "getEffectiveTodayTokens", "getMaxUnlockedLevel",
    "getRealHomeState", "getActiveHomeState", "saveActiveHomeState", "grantGachaReward",
    "renderEvoModal", "renderWearCardHtml", "renderGradeBadgeHtml", "isHomeItemPreviewAllowed",
  ].map(uiFunction).join("\n") + `
    function getTodayKey() { return today; }
    function renderBunnyState(tokens) { ephTokens = tokens; }
  `, scope);
  return {
    nodes, scope, writes, boostClasses,
    card: lv => nodes.evoGrid.innerHTML.match(new RegExp(`<div class="evo-card[^"]*"[^>]*data-lv="${lv}">`))?.[0],
    wearCard: () => scope.renderWearCardHtml(
      scope.TOOTOO_REG.getWearable("tier6_collar"), scope.getActiveHomeState(),
      { balance: 1e9 }, scope.getMaxUnlockedLevel(), [],
    ),
  };
}

test("same-day XP grant immediately reveals the current Lv.6 card, innate switch, and shop tier", () => {
  const { nodes, scope, writes, card, wearCard } = harness();
  scope.renderEvoModal();
  assert.match(card(6), /data-locked="1"/);
  assert.doesNotMatch(nodes.evoGrid.innerHTML, /data-toggle-innate="6"/);
  assert.match(wearCard(), /tier-locked/);
  // Production reward entry point; the already open modal must be updated
  // without another telemetry payload, explicit render, or level-up animation.
  scope.grantGachaReward({ type: "xp", tokens: 35e6, name: "fixture" });
  assert.equal(scope.state.data.evo_peak_tokens, 575e6);
  assert.equal(scope.state.data.today_tokens, 565e6);
  assert.equal(scope.ephTokens, 600e6);
  assert.equal(scope.getMaxUnlockedLevel(), 6);
  assert.match(nodes.evoProgressBox.innerHTML, /今日：<strong>Lv\.6 红魔兔/);
  assert.match(nodes.evoProgressBox.innerHTML, /\(600\.00M · 含经验包 \+35M\)/);
  assert.equal(nodes.evoHint.textContent,
    "战力经验 = 今日 Token + 扭蛋/宝箱经验包 · 已解锁形态永久保留 · 点击可触发专属动效");
  assert.match(card(6), /current[^>]*data-locked="0"/);
  assert.match(nodes.evoGrid.innerHTML, /data-toggle-innate="6"/);
  assert.match(card(7), /data-locked="1"/);
  assert.match(wearCard(), /data-act="buy-wear"/);
  assert.doesNotMatch(wearCard(), /data-act="preview-wear"/, "luxury trial remains restricted");
  assert.deepEqual(writes.map(x => x[0]), ["storage", "carrot"], "only normal reward persistence");
  assert.deepEqual(Object.keys(writes[1][1]), ["home"]);
});

test("next day ignores stale boost, but backend-confirmed historical peak still unlocks cards and wear", () => {
  const { nodes, scope, card, wearCard } = harness();
  scope.carrotDiskState.home.xp_boost = { day: "2026-11-23", tokens: 900e6 };
  assert.equal(scope.getEffectiveTodayTokens(), 565e6);
  assert.equal(scope.getMaxUnlockedLevel(), 5);
  scope.state.data.evo_peak_tokens = 600e6;
  scope.state.data.today_tokens = 5e6;
  scope.renderEvoModal();
  assert.match(nodes.evoProgressBox.innerHTML, /今日：<strong>Lv\.1/);
  assert.match(card(6), /unlocked[^>]*data-locked="0"/);
  assert.match(card(7), /data-locked="1"/);
  assert.match(wearCard(), /data-act="buy-wear"/);
});

test("sandbox reward and simulated tokens preview only; real XP and peak survive leaving debug unchanged", () => {
  const { nodes, scope, writes, card, wearCard } = harness();
  const originalHome = structuredClone(scope.carrotDiskState.home);
  scope.debugState.active = true;
  scope.grantGachaReward({ type: "xp", tokens: 35e6, name: "sandbox" });
  assert.match(card(6), /current[^>]*data-locked="0"/);
  assert.match(wearCard(), /data-act="buy-wear"/);
  scope.debugState.simTokens = 1.5e9;
  scope.renderEvoModal();
  assert.doesNotMatch(nodes.evoProgressBox.innerHTML, /含经验包/);
  assert.equal(scope.getMaxUnlockedLevel(), 8);
  assert.match(card(8), /current[^>]*data-locked="0"/);
  // Explicitly leave stale simulated values in memory to guard active-only scope.
  scope.debugState.active = false;
  scope.debugState.level = 8;
  scope.renderEvoModal();
  assert.match(nodes.evoProgressBox.innerHTML, /今日：<strong>Lv\.5/);
  assert.match(card(6), /data-locked="1"/);
  assert.match(wearCard(), /tier-locked/);
  assert.deepEqual(scope.carrotDiskState.home, originalHome);
  assert.equal(scope.state.data.evo_peak_tokens, 575e6);
  assert.deepEqual(writes, []);
});

test("simulated progress without a debug level does not write the real seen-rank baseline", () => {
  const { scope } = harness();
  const stop = new Error("stop after the rank checkpoint");
  const ranks = [];
  Object.assign(scope, {
    readTodaySeenRank: () => null,
    writeTodaySeenRank: (...args) => ranks.push(args),
    getTierVisual: () => { throw stop; },
    lastRealBunnyLv: null,
  });
  vm.runInContext(uiFunction("renderBunnyState"), scope);
  scope.debugState.active = true;
  scope.debugState.simTokens = 1.5e9;
  assert.throws(() => scope.renderBunnyState(scope.getEffectiveTodayTokens()), err => err === stop);
  assert.deepEqual(ranks, []);
  scope.debugState.active = false;
  assert.throws(() => scope.renderBunnyState(scope.getEffectiveTodayTokens()), err => err === stop);
  assert.deepEqual(ranks, [[5, 0]]);
});

test("real XP header annotates source, offers a narrow star icon, then restores legacy text cleanly", () => {
  const { nodes, scope, boostClasses } = harness();
  const normal = "<strong>675.86M</strong> / 1B";
  const progress = (text, star = false) =>
    scope.renderTodayXpText(text, star, scope.state.data.today_tokens, scope.getVisibleTodayXpBoostTokens());
  scope.state.data.today_tokens = 675.86e6;
  progress(normal);
  assert.equal(nodes.xpText.innerHTML, normal);
  assert.equal(nodes.xpWrap.title, "点击查看九阶战力进化图鉴");
  assert.equal(nodes.xpText.title, undefined);
  scope.carrotDiskState.home.xp_boost = { day: scope.today, tokens: 95e6 };
  progress("<strong>770.86M</strong> / 1B");
  assert.ok(boostClasses.has("has-xp-boost"));
  assert.match(nodes.xpText.innerHTML, /class="xp-boost-amount">\+95M</);
  assert.doesNotMatch(nodes.xpText.innerHTML, /star-rank/);
  assert.equal(nodes.xpText.title, nodes.xpWrap.title);
  assert.equal(nodes.xpWrap.title, "今日战力经验 770.86M = 真实 Token 675.86M + 扭蛋/宝箱经验包 95M（仅今日生效，不计入真实用量与费用）");
  progress("<strong>50.13B</strong> · 星", true);
  assert.match(nodes.xpText.innerHTML, /class="xp-boost-tag star-rank"/);
  assert.match(nodes.xpText.innerHTML, /class="xp-boost-icon" aria-hidden="true">⚡</);
  for (const context of ["minimal", "debug", "stale"]) {
    scope.minimalMode = context === "minimal";
    scope.debugState.active = context === "debug";
    scope.debugState.simTokens = context === "debug" ? 3.1e9 : null;
    scope.carrotDiskState.home.xp_boost.day = context === "stale" ? "2026-11-23" : scope.today;
    progress(normal);
    assert.equal(nodes.xpText.innerHTML, normal, context);
    assert.equal(nodes.xpText.title, undefined, context);
    assert.equal(nodes.xpWrap.title, "点击查看九阶战力进化图鉴", context);
    assert.equal(boostClasses.has("has-xp-boost"), false, context);
  }
});
