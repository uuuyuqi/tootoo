const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const html = readFileSync(join(__dirname, "../ui/index.html"), "utf8");
function codeBetween(start, end) {
  const a = html.indexOf(start);
  const b = html.indexOf(end, a);
  assert.notEqual(a, -1, start);
  assert.notEqual(b, -1, end);
  return html.slice(a, b);
}

function harness(reducedMotion = false, roll = 0.03) {
  let now = 0, nextFrame = 0;
  const frames = new Map(), timers = [], effects = [], writes = [], observers = [];
  function element(name) {
    const events = {}, classes = new Set();
    let transform = name;
    return {
      dataset: { r: "5.6" }, classes, style: { setProperty() {} },
      classList: {
        add(...keys) {
          keys.forEach(key => classes.add(key));
          if (name === "gachaModal") for (const fn of observers) fn();
        },
        remove(...keys) { keys.forEach(key => classes.delete(key)); },
        contains: key => classes.has(key),
      },
      addEventListener(type, cb) { events[type] = cb; },
      fire(type) { events[type]?.(); },
      setAttribute(attr, value) { if (attr === "transform") transform = value; },
      get transform() { return transform; },
      replaceChildren() {},
    };
  }
  const elements = Object.fromEntries([
    "gachaBtn", "gachaCloseBtn", "gachaModal", "gachaMachine", "gachaPullBtn", "gachaResult",
  ].map(id => [id, element(id)]));
  const balls = [element("orange resting"), element("pink resting")];
  const scope = vm.createContext({
    document: {
      querySelectorAll: sel => sel === "#gmCapsulesLayer .gm-ball" ? balls : [],
      getElementById: id => elements[id],
    },
    window: { matchMedia: () => ({ matches: reducedMotion }) },
    performance: { now: () => now },
    requestAnimationFrame: cb => { const id = ++nextFrame; frames.set(id, cb); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    MutationObserver: class { constructor(cb) { this.cb = cb; } observe() { observers.push(this.cb); } },
    setTimeout: (cb, wait) => timers.push({ cb, when: now + wait }),
    Math: Object.assign(Object.create(Math), { random: () => roll }),
    minimalMode: false,
    debugState: { active: false }, DEV_DEBUG_ENABLED: true,
    getGachaCoinState: () => ({ balance: 5, realBalance: 5, key: "daily", realSpent: 0 }),
    localStorage: { setItem() {} },
    persistCarrotPatch: patch => writes.push(patch),
    renderAlchemyStats() {}, renderGachaMeta() {}, cancelCarrotRoll() {},
    pauseAgyQuotaLoadingRetry() {}, pausePopoverArcade() {}, disconnectStream() {},
    popoverVisible: true,
    playSfx: sound => effects.push(sound),
    pickWeightedGacha: r => ({ r, icon: "★" }),
    grantGachaReward: pick => { effects.push(`grant-${pick.r}`); return { actualName: "fixture reward" }; },
    spawnConfettiBurst: () => effects.push("confetti"),
    activateStardust: () => effects.push("stardust"),
    gachaCinemaCtrl: { show: () => effects.push("cinema") },
  });
  const dome = codeBetween("const gachaDomeSim = (() => {", "\n})();") + "\n})();";
  vm.runInContext([
    codeBetween("function openGachaModal()", "// ---- More Arcade Modal"),
    codeBetween("window.__onPopoverClose =", "// Native visibility is ordered"),
    dome,
    codeBetween("const GACHA_TIER_ODDS", "const GACHA_FIXED_ODDS"),
    codeBetween("function rollGachaTier", "function gachaTierOddsLabel"),
    codeBetween("// TOOTOO_GACHA_PULL_START", "// TOOTOO_GACHA_PULL_END"),
  ].join("\n"), scope);
  return {
    elements, frames, effects, writes, nativeClose: scope.window.__onPopoverClose,
    positions: () => balls.map(ball => ball.transform),
    frame(ts) {
      now = ts;
      const scheduled = [...frames.values()];
      frames.clear();
      scheduled.forEach(cb => cb(ts));
    },
    advanceTimers(ts) {
      now = ts;
      while (timers.length && timers[0].when <= now) timers.shift().cb();
    },
  };
}

test("capsules remain static while opening/hovering; actual draws animate only for their finite burst", () => {
  const h = harness(), { elements, frames, writes, effects } = h;
  const resting = h.positions();
  elements.gachaBtn.fire("click");
  elements.gachaMachine.fire("mouseenter");
  h.frame(100);
  assert.equal(frames.size, 0, "no idle or hover simulation");
  assert.deepEqual(h.positions(), resting);
  elements.gachaPullBtn.fire("click");
  elements.gachaPullBtn.fire("click");
  assert.equal(writes.length, 1, "still only one debit during the draw");
  assert.equal(frames.size, 1, "one active animation frame");
  h.frame(116);
  assert.notDeepEqual(h.positions(), resting);
  h.frame(670);
  h.advanceTimers(680); // shake stops and a single capsule starts its chute drop.
  assert.deepEqual(effects, ["gacha"]);
  assert.equal(elements.gachaMachine.classes.has("dispensing"), true);
  assert.equal(elements.gachaMachine.classes.has("shaking"), false);
  assert.equal(frames.size, 0);
  assert.deepEqual(h.positions(), ["translate(44.00, 54.00) rotate(0.0)", "translate(68.00, 54.00) rotate(0.0)"]);
  const atEnd = h.positions();
  elements.gachaPullBtn.fire("click");
  h.advanceTimers(1039);
  assert.equal(writes.length, 1);
  assert.deepEqual(effects, ["gacha"], "no reward or cinema before landing");
  h.advanceTimers(1040);
  assert.equal(elements.gachaMachine.classes.has("dispensing"), false);
  assert.equal(elements.gachaMachine.classes.has("dispensed"), true);
  assert.deepEqual(effects, ["gacha", "grant-SR", "confetti", "gold", "cinema"]);
  assert.match(elements.gachaResult.className, /tier-SR/);
  h.frame(3750);
  assert.deepEqual(h.positions(), atEnd, "no late autonomous rotation, even under hover");
  elements.gachaPullBtn.fire("click");
  h.frame(3766);
  assert.notDeepEqual(h.positions(), atEnd, "next draw starts a new motion burst");
});

test("closing mid-burst cancels RAF without cancelling or repeating a paid result", () => {
  const h = harness(), { elements, effects, writes, frames } = h;
  elements.gachaBtn.fire("click");
  elements.gachaPullBtn.fire("click");
  h.frame(16);
  elements.gachaCloseBtn.fire("click");
  assert.equal(frames.size, 0);
  assert.equal(elements.gachaMachine.classes.has("shaking"), false);
  const stopped = h.positions();
  h.advanceTimers(580);
  assert.deepEqual(effects, ["gacha", "grant-SR"]);
  assert.equal(writes.length, 1);
  elements.gachaBtn.fire("click");
  h.frame(600);
  assert.equal(frames.size, 0);
  assert.deepEqual(h.positions(), stopped, "reopen does not resume a cancelled burst");
});

test("closing during the chute drop clears the effect, but still settles the reward once", () => {
  const h = harness(), { elements, effects, writes } = h;
  elements.gachaBtn.fire("click");
  elements.gachaPullBtn.fire("click");
  h.advanceTimers(580);
  assert.equal(elements.gachaMachine.classes.has("dispensing"), true);
  elements.gachaCloseBtn.fire("click");
  h.advanceTimers(940);
  assert.equal(elements.gachaMachine.classes.has("dispensing"), false);
  assert.equal(elements.gachaMachine.classes.has("dispensed"), false);
  assert.deepEqual(effects, ["gacha", "grant-SR"]);
  assert.match(elements.gachaResult.className, /tier-SR/);
  assert.equal(writes.length, 1);
});

for (const [tier, roll, sound] of [["SSR", 0, "ssr"], ["SR", 0.03, "gold"]]) {
  test(`reduced motion shows the ${tier} result immediately with audio but no animated effects`, () => {
    const { elements, effects, frames, writes } = harness(true, roll);
    elements.gachaBtn.fire("click");
    elements.gachaPullBtn.fire("click");
    assert.equal(writes.length, 1);
    assert.equal(frames.size, 0);
    assert.equal(elements.gachaMachine.classes.has("shaking"), false);
    assert.equal(elements.gachaMachine.classes.has("dispensing"), false);
    assert.equal(elements.gachaMachine.classes.has("dispensed"), true);
    assert.equal(elements.gachaResult.className, `gacha-result tier-${tier}`);
    assert.doesNotMatch(elements.gachaResult.innerHTML, /gacha-spark-layer/);
    assert.deepEqual(effects, [`grant-${tier}`, sound]);
  });
}

for (const native of [false, true]) {
  for (const phase of ["shake", "drop"]) {
    test(`reopening after ${native ? "native popover" : "dialog"} closes during ${phase} settles quietly`, () => {
      const h = harness(), { elements, frames, effects, writes } = h;
      elements.gachaBtn.fire("click");
      elements.gachaPullBtn.fire("click");
      h.frame(16);
      if (phase === "drop") h.advanceTimers(580);
      if (native) h.nativeClose();
      else elements.gachaCloseBtn.fire("click");
      elements.gachaBtn.fire("click");
      assert.equal(frames.size, 0);
      h.advanceTimers(580);
      assert.equal(elements.gachaMachine.classes.has("dispensing"), false);
      h.advanceTimers(940);
      assert.equal(elements.gachaMachine.classes.has("dispensed"), false);
      assert.deepEqual(effects, ["gacha", "grant-SR"]);
      assert.equal(elements.gachaResult.className, "gacha-result tier-SR");
      assert.doesNotMatch(elements.gachaResult.innerHTML, /gacha-spark-layer/);
      assert.equal(writes.length, 1);
    });
  }
}
