const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const html = readFileSync(join(__dirname, "../ui/index.html"), "utf8");
const part = (from, to) => {
  const start = html.indexOf(from);
  const end = html.indexOf(to, start + from.length);
  assert.ok(start >= 0 && end >= 0, from);
  return html.slice(start, end);
};

function setup({ reduced = false, balance = 7, claimable = 12 } = {}) {
  let time = 0, next = 0, claimed = 0;
  let checkin = false;
  const timers = new Map(), live = new Set(), nodes = new Map(), input = {};
  const feedback = [], sounds = [], writes = [], launches = [];
  const setTimeout = (fn, ms) => {
    const id = ++next;
    timers.set(id, { fn, due: time + ms });
    return id;
  };
  const clearTimeout = (id) => timers.delete(id);
  function advance(to) {
    for (;;) {
      const task = [...timers].filter(([, job]) => job.due <= to)
        .sort((a, b) => a[1].due - b[1].due || a[0] - b[0])[0];
      if (!task) break;
      const [id, job] = task;
      timers.delete(id);
      time = job.due;
      job.fn();
    }
    time = to;
  }
  function item(id) {
    const elem = {
      id, textContent: "", style: {}, title: "", className: "", setAttribute() {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      getBoundingClientRect: () => ({left: 250, top: 30, right: 350, bottom: 50, width: 100, height: 20}),
      remove: () => live.delete(elem),
      addEventListener: (event, cb) => { elem[event] = cb; },
      animate(frames, options) {
        if (elem.className === "carrot-roll-particle") launches.push([time, options.duration]);
        const effect = {};
        const id = setTimeout(() => effect.onfinish?.(), options.duration);
        effect.cancel = () => clearTimeout(id);
        return effect;
      },
    };
    return elem;
  }
  const ctx = vm.createContext({
    document: {
      hidden: false,
      getElementById(id) { if (!nodes.has(id)) nodes.set(id, item(id)); return nodes.get(id); },
      querySelectorAll: () => [],
      createElement: () => item(""),
      body: { appendChild: node => live.add(node) },
    },
    window: {
      matchMedia: () => ({ matches: reduced, addEventListener: (e, cb) => { input.motion = cb; } }),
      addEventListener(e, cb) { input[e] = cb; },
    },
    setTimeout, clearTimeout, performance: { now: () => time },
    localStorage: { setItem() {} },
    debugState: { active: false },
    popoverVisible: true, minimalMode: false,
    pauseAgyQuotaLoadingRetry() {}, pausePopoverArcade() {}, disconnectStream() {},
    gachaDomeSim: { stop() {} },
    postNative: (action, {pattern}) => feedback.push([time, action, pattern]),
    playSfx: kind => sounds.push([time, kind]),
    fmtNum: String,
    getGachaCoinState: () => ({ balance, realBalance: balance, claimable: claimable - claimed,
      claimed, bonus: 0, spent: 0, remainForNext: 8, todayKey: "2026-11-26" }),
    getCheckinState: () => ({ checkedIn: checkin, today: "2026-11-26" }),
    getActiveLiveEvents: () => [],
    TOOTOO_REG: { getCheckinTotalReward: () => ({ total: 1, bonus: 0 }) },
    isYesterdayStr: () => false,
    persistCarrotPatch: patch => {
      writes.push([time, patch.balance]);
      balance = patch.balance;
      if (patch.claimed != null) claimed = patch.claimed;
      if (patch.checkin_day) checkin = true;
    },
  });
  vm.runInContext([
    part("const CARROT_LAND_INTERVAL", "function pickWeightedGacha("),
    part("function paintCarrotWallet(", "function renderGachaMeta("),
    part("function closeGachaModal(", 'document.getElementById("gachaBtn").addEventListener'),
    part("window.__onPopoverClose = ", "// Native visibility is ordered"),
    part("function performDailyCheckin(", "// ---- Wearable SVG"),
    part("function spawnPatrolCapsule(", "let patrolRunning"),
    "function renderGachaMeta() { paintCarrotWallet(getGachaCoinState()); }",
  ].join("\n"), ctx);
  const view = id => ctx.document.getElementById(id).textContent;
  return { ctx, live, feedback, sounds, writes, launches, advance, view, input, timers,
    state: () => balance, spend() { balance--; ctx.renderGachaMeta(); } };
}

test("reward split caps at five and preserves the exact amount", () => {
  const { ctx } = setup();
  for (const [n, parts] of [[1,[1]], [5,[1,1,1,1,1]], [12,[2,2,3,2,3]], [0,[]], [1.5,[]]]) {
    assert.deepEqual(Array.from(ctx.splitCarrotReward(n)), parts);
  }
  for (const n of [6, 17, 50, Number.MAX_SAFE_INTEGER]) {
    const parts = ctx.splitCarrotReward(n);
    assert.equal(parts.length, 5);
    assert.equal(parts.reduce((a,b) => a+b, 0), n);
    assert.ok(Math.max(...parts) - Math.min(...parts) <= 1);
  }
});

test("real credit is immediate; five synchronized flights land 220 ms apart", () => {
  const h = setup();
  h.ctx.claimCarrotCoins();
  assert.deepEqual(h.writes, [[0,19]]);
  assert.equal(h.state(), 19);
  assert.equal(h.view("gachaHeaderCoins"), 7);
  h.advance(319);
  assert.deepEqual(h.feedback, []);
  for (const [i, sum] of [9,11,14,16,19].entries()) {
    h.advance(320 + 220*i);
    h.ctx.renderGachaMeta();
    for (const id of ["gachaHeaderCoins","gachaCoins","homeHeaderCoins"]) assert.equal(h.view(id), sum);
    assert.match(h.view("gachaPullBtn"), new RegExp("剩 " + sum + " 枚"));
    assert.match(h.ctx.document.getElementById("carrotMintFoot").innerHTML, new RegExp("余 " + sum + " 币"));
  }
  h.advance(1800);
  assert.deepEqual(h.launches, [0,220,440,660,880].map(t=>[t,320]));
  assert.deepEqual(h.feedback, [320,540,760,980,1200].map(t=>[t,"haptic","levelChange"]));
  assert.deepEqual(h.sounds, [320,540,760,980,1200].map(t=>[t,"walletLand"]));
  assert.equal(h.live.size, 0);
  assert.equal(h.timers.size, 0);
});

for (const [name, action, balance] of [
  ["a spend", h => h.spend(), 18],
  ["popover close", h => h.ctx.window.__onPopoverClose(), 19],
  ["dialog close", h => h.ctx.closeGachaModal(), 19],
  ["pagehide", h => h.input.pagehide(), 19],
  ["motion preference change", h => h.input.motion({ matches:true }), 19],
]) {
  test(name + " immediately cancels every remaining effect and displays the actual balance", () => {
    const h = setup();
    h.ctx.claimCarrotCoins();
    h.advance(345);
    assert.ok(h.live.size > 0);
    action(h);
    assert.equal(h.live.size, 0);
    assert.equal(h.timers.size, 0);
    assert.equal(h.view("gachaCoins"), balance);
    h.advance(2600);
    assert.equal(h.feedback.length, 1);
    assert.equal(h.view("gachaHeaderCoins"), balance);
  });
}

test("new reward replaces an unfinished roll without replaying the first", () => {
  const h = setup();
  h.ctx.claimCarrotCoins();
  h.advance(110);
  h.ctx.performDailyCheckin(h.ctx.document.getElementById("gachaCheckinBtn"));
  assert.deepEqual(h.writes, [[0,19],[110,20]]);
  assert.equal(h.view("gachaHeaderCoins"), 19);
  h.advance(1100);
  assert.equal(h.view("gachaHeaderCoins"), 20);
  assert.deepEqual(h.feedback, [[430,"haptic","levelChange"]]);
});

test("home check-in and dashboard patrol each pay one coin and one landing", () => {
  const h = setup();
  h.ctx.performDailyCheckin(h.ctx.document.getElementById("homeCheckinBtn"));
  assert.equal(h.view("homeHeaderCoins"), 7);
  h.advance(800);
  assert.equal(h.view("homeHeaderCoins"), 8);
  h.ctx.spawnPatrolCapsule();
  const cap = [...h.live].find(n=>n.className === "patrol-capsule");
  cap.click({ stopPropagation() {} });
  assert.ok([...h.live].some(n=>n.className.includes("carrot-roll-wallet")));
  h.advance(2000);
  assert.deepEqual(h.writes, [[0,8],[800,9]]);
  assert.deepEqual(h.feedback, [[320,"haptic","levelChange"],[1120,"haptic","levelChange"]]);
});

test("reduced motion skips all particles and bounce and gives one haptic", () => {
  const h = setup({ reduced:true, balance:0 });
  h.ctx.claimCarrotCoins();
  assert.equal(h.view("gachaHeaderCoins"), 12);
  h.advance(2000);
  assert.equal(h.live.size, 0);
  assert.deepEqual(h.launches, []);
  assert.deepEqual(h.feedback, [[0,"haptic","levelChange"]]);
});

test("a slow credit POST cannot land in storage after the immediate spend", async () => {
  const calls = [];
  let finishCredit;
  const ctx = vm.createContext({
    carrotDiskState: {},
    fetch: (_, options) => {
      const balance = JSON.parse(options.body).balance;
      calls.push(balance);
      return balance === 19 ? new Promise(resolve => { finishCredit = resolve; }) : Promise.resolve();
    },
  });
  vm.runInContext("let carrotWriteTail = Promise.resolve(); let carrotRevision = 0;\n" +
    part("function persistCarrotPatch(", "function getRealGachaCollected("), ctx);
  ctx.persistCarrotPatch({balance:19});
  ctx.persistCarrotPatch({balance:18});
  assert.equal(ctx.carrotDiskState.balance, 18);
  await new Promise(setImmediate);
  assert.deepEqual(calls,[19]);
  finishCredit();
  await vm.runInContext("carrotWriteTail", ctx);
  assert.deepEqual(calls,[19,18]);
});
