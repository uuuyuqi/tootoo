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
  const clicks = {};
  const effects = { render: 0, scroll: 0, sound: 0 };
  const classNames = new Set();
  const previewLabel = { textContent: "" };
  const nodes = {
    homeModal: { classList: { toggle(k, value) { if (value) classNames.add(k); else classNames.delete(k); } } },
    homePreviewLabel: previewLabel,
    homeShopGrid: { addEventListener(event, cb) { clicks[event] = cb; } },
  };
  const document = {
    getElementById: (id) => nodes[id] || null,
    querySelector: () => ({ scrollTo() { effects.scroll++; } }),
    querySelectorAll: () => [],
  };
  const state = { house: "", owned_houses: [], owned_decor: [], owned_wear: [], decor: {}, wear: {} };
  const homeUiState = { view: "shop", tab: "", preview: null };
  const debugState = { unlockAll: false, active: false };
  const vmScope = vm.createContext({
    document, homeUiState, debugState, debugFridayMock: false, _lastHomeStageKey: "cached",
    getActiveHomeState: () => state, enforceHomeLeaseValidity: (h) => h,
    getMaxUnlockedLevel: () => vmScope.tier, tier: 10,
    getActiveLiveEvents: () => [], getGachaCoinState: () => ({ balance: 10 ** 9 }),
    countOwnedSecrets: () => ({ owned: 0, total: 0 }),
    isHomeSecretUnlocked: () => true,
    renderPriceHtml: () => "", TIER_INNATE_ACCESSORIES: {},
    HOME_SLOT_META: new Proxy({}, { get: () => ({ short: "slot" }) }),
    renderHomeModal() { effects.render++; },
    playSfx() { effects.sound++; },
  });
  vm.runInContext(catalog, vmScope);
  const reg = vmScope.TooTooRegistry;
  Object.assign(vmScope, {
    TOOTOO_REG: reg, HOME_GRADE_META: reg.economy.gradeMeta,
    HOME_HOUSES: reg.houses, HOME_DECORS: reg.decors, HOME_WEARABLES: reg.wearables,
  });
  const listenerStart = html.indexOf('document.getElementById("homeShopGrid").addEventListener("click"');
  assert.notEqual(listenerStart, -1);
  const listener = html.slice(listenerStart, html.indexOf("\n});", listenerStart) + 4);
  const functions = [
    "isHomeItemPreviewAllowed", "getHomePreviewItem", "getEffectiveStageViewState",
    "renderGradeBadgeHtml", "renderDecorCardHtml", "renderWearCardHtml", "renderHomeShop",
  ];
  vm.runInContext(functions.map(uiFunction).join("\n") + "\n" + listener, vmScope);
  // Use an owned house that can host decor and remember real equipment separately.
  state.house = reg.houses.find((house) => house.slots.length).id;
  state.owned_houses.push(state.house);
  const click = (kind, id) => clicks.click({
    target: { closest: () => ({ dataset: { act: `preview-${kind}`, id } }) },
  });
  return { scope: vmScope, reg, state, homeUiState, debugState, click, effects, classNames, previewLabel };
}

const allowedGrade = (item) => !item.secret && ["basic", "craft"].includes(item.grade || "basic");

test("full furniture and outfit catalog uses the grade cutoff and never previews secrets", () => {
  const { reg, scope } = harness();
  assert.ok(reg.decors.length && reg.wearables.length);
  for (const item of [...reg.decors, ...reg.wearables]) {
    assert.equal(scope.isHomeItemPreviewAllowed(item), allowedGrade(item), item.id);
  }
  for (const grade of ["basic", "craft", "luxury", "mythic", "event", "secret", "unknown"]) {
    assert.equal(scope.isHomeItemPreviewAllowed({ grade }), ["basic", "craft"].includes(grade), grade);
    assert.equal(scope.isHomeItemPreviewAllowed({ grade, secret: true }), false, grade);
  }
  assert.equal(scope.isHomeItemPreviewAllowed(undefined), false);
  assert.equal(scope.isHomeItemPreviewAllowed({}), true);
});

test("real furniture and outfit cards omit restricted previews, retaining purchase and owned equip", () => {
  const { reg, scope, state } = harness();
  const h = reg.houses.find((house) => house.slots.length >= 5);
  if (h) state.house = h.id;
  for (const [kind, items, render] of [
    ["decor", reg.decors, scope.renderDecorCardHtml],
    ["wear", reg.wearables, scope.renderWearCardHtml],
  ]) {
    const button = new RegExp(`data-act="preview-${kind}"`);
    for (const item of items) {
      const card = render(item, state, { balance: 10 ** 9 }, 10, []);
      assert.equal(button.test(card), allowedGrade(item), item.id);
      assert.match(card, new RegExp(`data-act="buy-${kind}"`), item.id);
    }
    const premium = items.find((item) => item.grade === "luxury" &&
      (kind === "wear" || reg.getHouse(state.house).slots.includes(item.slot)));
    assert.ok(premium, kind);
    state[`owned_${kind}`].push(premium.id);
    const ownedCard = render(premium, state, { balance: 0 }, 10, []);
    assert.match(ownedCard, new RegExp(`data-act="equip-${kind}"`));
    assert.doesNotMatch(ownedCard, button);
  }
});

test("click guards actual catalog; allowed previews toggle and forged clicks clear without effects", () => {
  const { reg, scope, state, homeUiState, click, effects } = harness();
  for (const [kind, items] of [["decor", reg.decors], ["wear", reg.wearables]]) {
    const allowed = items.find(it => allowedGrade(it) && reg.isItemAvailable(it));
    const blocked = items.filter(it => !allowedGrade(it));
    assert.ok(allowed && blocked.length);
    click(kind, allowed.id);
    assert.equal(homeUiState.preview.id, allowed.id);
    click(kind, allowed.id);
    assert.equal(homeUiState.preview, null);
    for (const id of [...blocked.map(it => it.id), "missing-id"]) {
      homeUiState.preview = { kind, id: allowed.id };
      scope._lastHomeStageKey = "rendered";
      const previous = { ...effects };
      click(kind, id);
      assert.equal(homeUiState.preview, null, id);
      assert.equal(scope._lastHomeStageKey, "", id);
      assert.deepEqual(effects, { ...previous, render: previous.render + 1 }, id);
    }
    state[`owned_${kind}`].push(allowed.id);
    click(kind, allowed.id);
    assert.equal(homeUiState.preview, null, "owned is not a preview");
  }
});

test("wearable tier lock agrees between actual card, click, and stale stage; debug mode keeps parity", () => {
  const { reg, scope, state, homeUiState, debugState, click } = harness();
  const item = { id: "test-tier-lock", slot: "hat", grade: "craft", minTier: 8, price: 1 };
  reg.registerWearable(item);
  scope.tier = 7;
  assert.match(scope.renderWearCardHtml(item, state, { balance: 100 }, 7, []), /待解锁/);
  assert.doesNotMatch(scope.renderWearCardHtml(item, state, { balance: 100 }, 7, []), /preview-wear/);
  click("wear", item.id);
  assert.equal(homeUiState.preview, null);
  homeUiState.preview = { kind: "wear", id: item.id };
  assert.equal(scope.getEffectiveStageViewState().isPreview, false);
  debugState.unlockAll = true;
  assert.equal(scope.getEffectiveStageViewState().isPreview, true);
  assert.match(scope.renderWearCardHtml(item, state, { balance: 100 }, 10, []), /preview-wear/);
});

test("stage and shop strip clear stale restricted or unknown IDs without changing real equipment", () => {
  const { reg, scope, state, homeUiState, classNames, previewLabel } = harness();
  for (const [kind, items] of [["decor", reg.decors], ["wear", reg.wearables]]) {
    const allowed = items.find(it => allowedGrade(it) && reg.isItemAvailable(it));
    const blocked = items.find(it => it.grade === "luxury");
    assert.ok(allowed && blocked, kind);
    homeUiState.preview = { kind, id: allowed.id };
    scope.renderHomeShop();
    assert.equal(classNames.has("has-preview"), true);
    assert.ok(previewLabel.textContent.includes(allowed.name));
    const view = scope.getEffectiveStageViewState();
    assert.equal(view[kind][allowed.slot], allowed.id);
    assert.equal(state[kind][allowed.slot], undefined);
    for (const id of [blocked.id, "missing", allowed.id]) {
      if (id === allowed.id) state[`owned_${kind}`].push(id);
      homeUiState.preview = { kind, id };
      const real = scope.getEffectiveStageViewState();
      assert.equal(real.isPreview, false);
      assert.equal(real.houseId, state.house);
      assert.equal(real[kind], state[kind]);
      scope.renderHomeShop();
      assert.equal(classNames.has("has-preview"), false);
      assert.equal(previewLabel.textContent, "");
      assert.equal(homeUiState.preview, null);
    }
  }
});
