const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const assert = require("node:assert/strict");

const html = readFileSync(join(__dirname, "../ui/index.html"), "utf8");
const debugBuild = /\/\*__TOOTOO_DEBUG_FLAG__\*\/true/.test(html);
const pull = html.split("// TOOTOO_GACHA_PULL_START\n")[1].split("// TOOTOO_GACHA_PULL_END")[0];
const odds = html.slice(html.indexOf("const GACHA_TIER_ODDS"), html.indexOf("const DEFAULT_HOME_STATE"));
const pool = html.match(/const GACHA_POOL = \[[\s\S]*?\n\];/)[0];
const picker = html.match(/function pickWeightedGacha\([\s\S]*?\n}/)[0];
const mystery = html.match(/function rollInGameMysteryLoot\(\) \{[\s\S]*?\n}/)[0];

function harness({ roll = 0.95, debug = false, balance = 5 } = {}) {
  const timers = [], events = [], states = [], writes = [];
  const elements = { gachaPullBtn: {}, gachaResult: {}, gachaModal: {classList:{contains:()=>true}}, gachaMachine: {
    dataset:{},style:{setProperty(){}},
    classList: { add() {}, remove() {}, contains:()=>true },
  } };
  elements.gachaPullBtn.addEventListener = (_, callback) => { elements.gachaPullBtn.click = callback; };
  elements.gachaResult.replaceChildren = (...values) => { elements.gachaResult.children = values; };
  const runtime = {
    window: {matchMedia:()=>({matches:false})},
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
  vm.runInContext(odds + "\n" + pool + "\n" + pull + "\n" + mystery, scope);
  return { scope, run: (s) => vm.runInContext(s, scope), timers, elements, events, writes, states };
}

test("machine uses the intended tier boundaries and displays those same odds", () => {
  const { run } = harness();
  const counts = {};
  for (let i = 0; i < 400; i++) {
    const r = run(`rollMachineGachaTier(${(i + .5) / 400})`);
    counts[r] = (counts[r] || 0) + 1;
  }
  assert.deepEqual(counts, { MISS: 120, N: 200, R: 60, SR: 18, SSR: 2 });
  assert.equal(run('rollMachineGachaTier(0.7)'), "MISS");
  assert.match(html, /概率: \$\{gachaTierOddsLabel\(\)\}/);
  assert.equal(run("gachaTierOddsLabel()"), "MISS 30% · N 50% · R 15% · SR 4.5% · SSR 0.5%");
});

test("MISS costs exactly one coin, never invokes reward or confetti/cinema, and plays only the quiet sound", () => {
  const { timers, elements, events, writes, states } = harness();
  elements.gachaPullBtn.click();
  elements.gachaPullBtn.click(); // Still busy; no second debit before reveal.
  assert.equal(timers.length, 1);
  timers.shift()(); // shake
  timers.shift()(); // land
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
    timers.shift()(); // shake
  timers.shift()(); // land
    assert.deepEqual(events, ["gachaMiss"]);
    return;
  }
  assert.match(html, forced);
  const { timers, elements, writes, events, scope } = harness({ roll: 0.65, debug: true });
  scope.debugState.gachaForce = "MISS";
  elements.gachaPullBtn.click();
  timers.shift()(); // shake
  timers.shift()(); // land
  assert.deepEqual(writes, []);
  assert.equal(scope.debugState.gachaSpent, 1);
  assert.deepEqual(events, ["gachaMiss"]);
  assert.match(elements.gachaResult.children[0].textContent, /沙盒/);
});

test("chests never MISS and grant the tier rolled using chest-specific weighting", () => {
  const { scope, run, states } = harness();
  const counts = {};
  scope.pickWeightedGacha = (tier, source) => { states.push([tier, source]); return { r: tier }; };
  for (let i = 0; i < 400; i++) {
    scope.Math.random = () => (i + .5) / 400;
    run("rollInGameMysteryLoot()");
  }
  for (const [tier, source] of states) {
    assert.equal(source, "chest");
    counts[tier] = (counts[tier] || 0) + 1;
  }
  assert.deepEqual(counts, { N: 315, R: 72, SR: 12, SSR: 1 });
});

test("fixed item rates are unconditional; each weighted interval selects the expected reward", () => {
  const run = code => vm.runInNewContext(odds + pool + picker + code);
  const report = run(`
    Object.fromEntries(Object.entries(GACHA_TIER_ODDS).map(([source, tiers]) => {
      const items = [];
      for (const [tier, tierPct] of Object.entries(tiers)) {
        if (tier === "MISS") continue;
        let start = 0;
        for (const { item, percent } of gachaRewardOdds(tier, source)) {
          items.push({ item, percent, drawn: pickWeightedGacha(tier, source, (start + percent/2) / tierPct).id });
          start += percent;
        }
        if (Math.abs(start - tierPct) > 1e-8) throw Error(source + tier + " doesn't sum to tier rate");
      }
      return [source, items];
    }));
  `);
  const rates = {
    machine: [0.5, 0.1, 20 * 6 / 95, 8 * 8 / 93, 0.2, 0.02],
    chest: [0.5, 0.1, 25 * 6 / 95, 6 * 8 / 93, 0.1, 0.01],
  };
  for (const [source, items] of Object.entries(report)) {
    assert.equal(new Set(items.map(x => x.item.id)).size, items.length);
    const byId = Object.fromEntries(items.map(x => [x.item.id, x.percent]));
    for (const { item, drawn, percent } of items) {
      assert.ok(percent > 0, item.name);
      assert.equal(drawn, item.id);
    }
    for (const [idx, ids] of [[103], [203], [214,215], [310,311], [406], [408,409,410,411,412]].entries()) {
      for (const id of ids) assert.equal(byId[id], rates[source][idx]);
    }
    const fresh = items.reduce((sum, { item, percent }) => sum + (item.amount || 0) * percent / 100, 0);
    const veteran = items.reduce((sum, { item, percent }) => sum + (item.amount || item.refund || 0) * percent / 100, 0);
    assert.ok(fresh >= .10 && fresh <= .22, `${source} new-player coin return ${fresh}`);
    assert.ok(veteran >= fresh && veteran < .59, `${source} veteran coin return ${veteran}`);
  }
});
