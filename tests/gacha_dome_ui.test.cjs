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
  const settled = h.positions();
  assertLoosePile(settled.map(parsePose).map(ball => ({ ...ball, r: 5.6 })));
  h.frame(900);
  assert.deepEqual(h.positions(), settled, "the settled pile does not keep moving");
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

function parsePose(raw) {
  const match = /translate\(([-\d.]+), ([-\d.]+)\) rotate\(([-\d.]+)\)/.exec(raw);
  assert.ok(match, raw);
  return { x: Number(match[1]), y: Number(match[2]), a: Number(match[3]) };
}

function assertLoosePile(balls) {
  const CX = 56, CY = 46, DOME_R = 24.8, FLOOR_Y = 59.6;
  assert.ok(balls.length >= 2);
  const angles = new Set();
  let ySum = 0;
  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];
    ySum += ball.y;
    angles.add(ball.a);
    const domeSlack = (DOME_R - ball.r) - Math.hypot(ball.x - CX, ball.y - CY);
    assert.ok(domeSlack > 0.4, `capsule ${i} clips the glass`);
    const floorGap = (FLOOR_Y - ball.r) - ball.y;
    assert.ok(floorGap > -0.05, `capsule ${i} sinks through the collar`);
    assert.ok(ball.y >= 40.4, `capsule ${i} is parked above the bottom of the dome`);
    let supported = Math.abs(floorGap) < 0.35;
    for (let j = 0; j < balls.length; j++) {
      if (i === j) continue;
      const other = balls[j];
      const gap = Math.hypot(ball.x - other.x, ball.y - other.y) - (ball.r + other.r);
      assert.ok(gap > -0.05, `capsules ${i} and ${j} overlap`);
      if (gap < 0.4 && ball.y < other.y - 0.4) supported = true;
    }
    assert.ok(supported, `capsule ${i} is floating`);
    assert.notEqual(ball.a, 0);
  }
  assert.ok(angles.size >= Math.min(4, balls.length), "capsule seams share one angle");
  assert.ok(ySum / balls.length > 46, "the pile is not resting in the bottom half of the dome");
}

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, name);
  let depth = 0;
  for (let i = source.indexOf("{", start); i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (!depth) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unclosed ${name}`);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("idle capsules already sit in a loose bottom pile", () => {
  const painted = [...html.matchAll(/<g class="gm-ball" data-r="([\d.]+)" transform="translate\(([\d.]+), ([\d.]+)\) rotate\((-?[\d.]+)\)">/g)];
  assert.equal(painted.length, 6);
  const balls = painted.map(match => ({
    r: Number(match[1]), x: Number(match[2]), y: Number(match[3]), a: Number(match[4]),
  }));
  assertLoosePile(balls);
  assert.ok(balls.some(ball => (59.6 - ball.r) - ball.y > 1), "every capsule is on one tidy floor row");
  assert.ok(balls.filter(ball => Math.abs((59.6 - ball.r) - ball.y) < 0.35).length >= 2);
});

test("each shake can settle into a different supported pile", () => {
  const scatter = vm.runInNewContext(`${extractFunction(html, "scatterCapsules")}\nscatterCapsules`);
  const radii = [5.6, 5.6, 6.1, 5.5, 5.3, 5.3];
  const signatures = new Set();
  for (let seed = 1; seed <= 24; seed++) {
    const balls = scatter(radii.map(r => ({ r })), mulberry32(seed));
    balls.forEach((ball, i) => { ball.r = radii[i]; });
    assertLoosePile(balls);
    signatures.add(balls.map(ball => `${ball.x},${ball.y},${ball.a}`).join("|"));
  }
  assert.ok(signatures.size >= 20, "rest poses collapse to one fixed layout");
  const stuck = scatter(radii.map(r => ({ r })), () => 0.03);
  stuck.forEach((ball, i) => { ball.r = radii[i]; });
  assertLoosePile(stuck);
  const again = scatter(radii.map(r => ({ r })), mulberry32(7));
  const same = scatter(radii.map(r => ({ r })), mulberry32(7));
  assert.deepEqual(again, same, "a seed settles the same way twice");
  assert.notDeepEqual(again.map(ball => [ball.x, ball.y]), stuck.map(ball => [ball.x, ball.y]));
});

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
