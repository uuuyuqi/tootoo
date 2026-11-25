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

function harness() {
  let now = 0, nextFrame = 0;
  const frames = new Map(), timers = [], effects = [], writes = [], observers = [];
  function element(name) {
    const events = {}, classes = new Set();
    let transform = name;
    return {
      dataset: { r: "5.6" }, classes,
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
    performance: { now: () => now },
    requestAnimationFrame: cb => { const id = ++nextFrame; frames.set(id, cb); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    MutationObserver: class { constructor(cb) { this.cb = cb; } observe() { observers.push(this.cb); } },
    setTimeout: (cb, wait) => timers.push({ cb, when: now + wait }),
    Math: Object.assign(Object.create(Math), { random: () => 0.03 }), // SR
    minimalMode: false,
    debugState: { active: false }, DEV_DEBUG_ENABLED: true,
    getGachaCoinState: () => ({ balance: 5, realBalance: 5, key: "daily", realSpent: 0 }),
    localStorage: { setItem() {} },
    persistCarrotPatch: patch => writes.push(patch),
    renderAlchemyStats() {}, renderGachaMeta() {},
    playSfx: sound => effects.push(sound),
    pickWeightedGacha: r => ({ r, icon: "★" }),
    grantGachaReward: pick => { effects.push(`grant-${pick.r}`); return { actualName: "fixture reward" }; },
    spawnConfettiBurst: () => effects.push("confetti"),
    gachaCinemaCtrl: { show: () => effects.push("cinema") },
  });
  const dome = codeBetween("const gachaDomeSim = (() => {", "\n})();") + "\n})();";
  vm.runInContext([
    codeBetween("function openGachaModal()", "// ---- More Arcade Modal"),
    dome,
    codeBetween("const GACHA_TIER_ODDS", "const GACHA_FIXED_ODDS"),
    codeBetween("function rollGachaTier", "function gachaTierOddsLabel"),
    codeBetween("// TOOTOO_GACHA_PULL_START", "// TOOTOO_GACHA_PULL_END"),
  ].join("\n"), scope);
  return {
    elements, frames, effects, writes,
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
  h.advanceTimers(580); // 480 ms reveal; preserve result effects.
  assert.deepEqual(effects, ["gacha", "grant-SR", "confetti", "gold", "cinema"]);
  assert.match(elements.gachaResult.className, /tier-SR/);
  h.frame(749);
  const atEnd = h.positions();
  h.frame(750); // 650 ms from the draw.
  assert.equal(frames.size, 0);
  assert.equal(elements.gachaMachine.classes.has("shaking"), false);
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
  h.advanceTimers(480);
  assert.deepEqual(effects, ["gacha", "grant-SR", "confetti", "gold", "cinema"]);
  assert.equal(writes.length, 1);
  elements.gachaBtn.fire("click");
  h.frame(600);
  assert.equal(frames.size, 0);
  assert.deepEqual(h.positions(), stopped, "reopen does not resume a cancelled burst");
});
