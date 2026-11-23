const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const assert = require("node:assert/strict");

const html = readFileSync(join(__dirname, "../ui/index.html"), "utf8");
const debugBuild = /\/\*__TOOTOO_DEBUG_FLAG__\*\/true/.test(html);
const pull = html.split("// TOOTOO_GACHA_PULL_START\n")[1].split("// TOOTOO_GACHA_PULL_END")[0];
const mystery = html.match(/function rollInGameMysteryLoot\(\) \{[\s\S]*?\n}/)[0];

function harness({ roll = 0.95, debug = false, balance = 5 } = {}) {
  const timers = [], events = [], states = [], writes = [];
  const elements = { gachaPullBtn: {}, gachaResult: {}, gachaMachine: {
    classList: { add() {}, remove() {} },
  } };
  elements.gachaPullBtn.addEventListener = (_, callback) => { elements.gachaPullBtn.click = callback; };
  elements.gachaResult.replaceChildren = (...values) => { elements.gachaResult.children = values; };
  const runtime = {
    DEV_DEBUG_ENABLED: debugBuild,
    debugState: { active: debug, gachaSpent: 0, gachaForce: "auto" },
    Math: { random: () => roll, max: Math.max, floor: Math.floor },
    document: {
      getElementById: (id) => elements[id],
      createElement: (tagName) => ({ tagName }),
    },
    getGachaCoinState: () => ({ balance, realBalance: balance, realSpent: 8, key: "daily", todayKey: "today" }),
    persistCarrotPatch: (patch) => writes.push([patch.balance, patch.spent]),
    localStorage: { setItem: (key, value) => writes.push([key, value]) },
    renderGachaMeta() {},
    setTimeout: (callback) => timers.push(callback),
    playSfx: (kind) => events.push(kind),
    pickWeightedGacha: (r) => { states.push(r); return { r }; },
    grantGachaReward: () => { events.push("grant"); return {}; },
    spawnConfettiBurst: () => events.push("confetti"),
    activateStardust: () => events.push("stardust"),
    renderAdventurePropBars() {},
    renderBackdropBar() {},
    gachaCinemaCtrl: { show: () => events.push("cinema") },
    fmtNum: String,
  };
  const scope = vm.createContext(runtime);
  vm.runInContext(pull + "\n" + mystery, scope);
  return { scope, run: (s) => vm.runInContext(s, scope), timers, elements, events, writes, states };
}

test("machine's 100 equally spaced centile midpoints exactly match displayed odds", () => {
  const { run } = harness();
  const counts = {};
  for (let i = 0; i < 100; i++) {
    const r = run(`rollMachineGachaTier(${(i + .5) / 100})`);
    counts[r] = (counts[r] || 0) + 1;
  }
  assert.deepEqual(counts, { MISS: 30, N: 40, R: 20, SR: 8, SSR: 2 });
  assert.equal(run('rollMachineGachaTier(0.7)'), "MISS");
  assert.match(html, /MISS 30% · N 40% · R 20% · SR 8% · SSR 2%/);
});

test("MISS costs exactly one coin, never invokes reward or confetti/cinema, and plays only the quiet sound", () => {
  const { timers, elements, events, writes, states } = harness();
  elements.gachaPullBtn.click();
  elements.gachaPullBtn.click(); // Still busy; no second debit before reveal.
  assert.equal(timers.length, 1);
  timers.shift()();
  assert.deepEqual(writes, [["daily","9"],["tootoo_carrot_balance","4"],[4,9]]);
  assert.deepEqual(events, ["gachaMiss"]);
  assert.deepEqual(states, []);
  assert.match(elements.gachaResult.children[0].textContent, /MISS · 空包/);
  assert.ok(elements.gachaResult.children[1].textContent);
});

test("the MISS quote pool has 12–16 unique quotes and never repeats consecutively", () => {
  const { run } = harness();
  const size = run("new Set(GACHA_MISS_QUOTES).size");
  assert.equal(size, run("GACHA_MISS_QUOTES.length"));
  assert.ok(size >= 12 && size <= 16);
  let previous;
  for (let i = 0; i < 100; i++) {
    const quote = run("nextGachaMissQuote(0.5)");
    assert.notEqual(quote, previous);
    previous = quote;
  }
});

test("debug force MISS is available only in dev and only consumes sandbox currency", () => {
  const forced = /data-rarity="MISS"/;
  if (!debugBuild) {
    assert.doesNotMatch(html, forced);
    assert.doesNotMatch(html, /id="dbgGachaForceChips"/);
    const { timers, elements, events, scope } = harness({ roll: 0.95, debug: true });
    scope.debugState.gachaForce = "SSR";
    elements.gachaPullBtn.click();
    timers.shift()();
    assert.deepEqual(events, ["gachaMiss"]);
    return;
  }
  assert.match(html, forced);
  const { timers, elements, writes, events, scope } = harness({ roll: 0.65, debug: true });
  scope.debugState.gachaForce = "MISS";
  elements.gachaPullBtn.click();
  timers.shift()();
  assert.deepEqual(writes, []);
  assert.equal(scope.debugState.gachaSpent, 1);
  assert.deepEqual(events, ["gachaMiss"]);
  assert.match(elements.gachaResult.children[0].textContent, /沙盒/);
});

test("game mystery drops retain their earlier 68/25/6/1 split and no MISS", () => {
  const counts = {};
  for (let i = 0; i < 100; i++) {
    const { run, states } = harness({ roll: (i + .5) / 100 });
    run("rollInGameMysteryLoot()");
    const r = states[0]; counts[r] = (counts[r] || 0) + 1;
  }
  assert.deepEqual(counts, { N: 68, R: 25, SR: 6, SSR: 1 });
});
