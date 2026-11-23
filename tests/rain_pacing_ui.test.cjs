const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const html = readFileSync(join(__dirname, "../ui/index.html"), "utf8");
function block(name) {
  return html.split("// TOOTOO_RAIN_" + name + "_START\n")[1].split("// TOOTOO_RAIN_" + name + "_END")[0];
}

function originalDrop(s, wave, rush, r) {
  if (wave) {
    return r < .018 ? "gacha_box" : r < .048 ? "carrot_coin" : r < .09 ? "pomegranate"
      : r < .14 ? "double_banana" : r < .28 ? "diamond" : r < .46 ? "gold"
      : r < .70 ? "cache" : "token";
  }
  return r < .016 ? "gacha_box" : r < .038 ? "carrot_coin"
    : r < .068 ? "wave_banana" : r < .102 ? "ice_banana" : r < .138 ? "double_banana"
    : r < .168 ? "pomegranate" : r < .200 ? "magnet_orb" : r < .228 ? "shield_bubble"
    : r < .256 ? "rainbow" : r < .286 ? "hourglass" : r < .340 ? "diamond"
    : r < (rush ? .44 : .39) ? "gold"
    : s.freezeTimer <= 0 && s.iceTimer <= 0 && r < (rush ? .52 : .49) ? "bomb"
    : r < .49 + s.cacheRate * .42 ? "cache" : "token";
}

test("normal / rush / wave retain the same individual hazard, coin, mystery and ordinary-score windows", () => {
  const ctx = vm.createContext({});
  const next = vm.runInContext(block("DROP") + "\nrollRainDrop", ctx);
  const strong = vm.runInContext("RAIN_STRONG_DROPS", ctx);
  for (const [wave, rush, freeze] of [[false, false, 0], [false, true, 0], [false, true, 2], [true, false, 0]]) {
    const s = { cacheRate: .42, freezeTimer: freeze, iceTimer: 0 };
    let powers = 0;
    for (let i = 0; i < 1000; i++) {
      const r = (i + .5) / 1000;
      s.powerupDropCooldown = 0;
      const old = originalDrop(s, wave, rush, r), now = next(s, wave, rush, r);
      if (!strong.has(old)) assert.equal(now, old);
      else assert.ok(now === "token" || strong.has(now));
      if (strong.has(now)) powers++;
      if (wave) assert.notEqual(now, "bomb");
    }
    assert.equal(powers, wave ? 60 : 180);
  }
});

test("strong drops consume a 1.8 sec pacing slot, but coin and mystery remain available", () => {
  const next = vm.runInNewContext(block("DROP") + "\nrollRainDrop");
  const s = { cacheRate: .42, freezeTimer: 0, iceTimer: 0, powerupDropCooldown: 0 };
  assert.equal(next(s, false, false, .10), "double_banana");
  assert.equal(s.powerupDropCooldown, 1.8);
  assert.equal(next(s, false, false, .19), "token");
  assert.equal(next(s, true, false, .065), "token");
  assert.equal(next(s, true, false, .01), "gacha_box");
  assert.equal(next(s, true, false, .02), "carrot_coin");
  assert.equal(next(s, false, false, .445), "bomb");
  assert.equal(s.powerupDropCooldown, 1.8);
  s.powerupDropCooldown = 0;
  assert.equal(next(s, true, false, .065), "pomegranate");
});

test("manual settlement preserves score/loot, settles milestones once and cannot resume", () => {
  const ids = ["rainEndBtn","rainEndControl","rainScore","rainTime","rainBest","arcadeModal","rainTitle","rainDesc","rainStartBtn","rainOverlay"];
  const ui = Object.fromEntries(ids.map((id) => [id, {
    hidden: false, textContent: "", addEventListener: (_, f) => { ui[id].click = f; },
    querySelector: () => ({}), classList: { remove() {} },
  }]));
  const coins = [], cancelled = [], writes = [];
  const rainState = { running: true, pausedForPopover: false, score: 1400, timeLeft: 8, maxCombo: 15, coinsCaught: 1, lootsFound: ["🎁 test"] };
  const rainKeys = { left: true, right: true };
  const ctx = vm.createContext({ rainState, rainKeys, rainRaf: 84,
    cancelAnimationFrame: (n) => cancelled.push(n),
    document: { getElementById: (id) => ui[id] },
    grantAdventureCoins: (amount) => (coins.push(amount), 1), // Existing helper caps this at one remaining coin.
    localStorage: { getItem: () => "900", setItem: (_, v) => writes.push(v) },
    spawnConfettiBurst() {}, playSfx() {},
  });
  vm.runInContext(block("SETTLEMENT"), ctx);
  ui.rainEndBtn.click();
  ui.rainEndBtn.click();
  vm.runInContext("settleRainRound()", ctx);
  assert.equal(rainState.running, false);
  assert.equal(rainState.pausedForPopover, false);
  assert.equal(ui.rainEndControl.hidden, true);
  assert.deepEqual(rainKeys, { left: false, right: false });
  assert.deepEqual(cancelled, [84]);
  assert.deepEqual(coins, [2]);
  assert.deepEqual(writes, ["1400"]);
  assert.match(ui.rainTitle.textContent, /1400/);
  assert.match(ui.rainDesc.textContent, /🎁 test/);
});

test("manual end control is present outside the release-stripped debug blocks", () => {
  assert.match(html, /<div id="rainEndControl" hidden[^>]*>\s*<button[^>]*id="rainEndBtn">结束本局/);
  assert.match(html, /if \(s\.timeLeft <= 0\) \{\s*settleRainRound\(\);/);
  assert.match(html, /powerupDropCooldown - dt/);
  assert.match(html, /接Token雨 立刻开启 8 秒超大范围磁铁/);
});

test("Space activates a focused End button without triggering the global dash", () => {
  const source = html.slice(html.indexOf('window.addEventListener("keydown"', html.indexOf('const rainKeys')),
    html.indexOf('window.addEventListener("keyup"', html.indexOf('const rainKeys')));
  let listener, dash = 0, calls = 0;
  vm.runInNewContext(source, { rainKeys: {}, rainState: { running: true },
    triggerRainDash: () => dash++, window: { addEventListener: (_, f) => { listener = f; } } });
  listener({ code: "Space", key: " ", target: { id: "rainEndBtn" }, preventDefault: () => calls++ });
  assert.equal(dash, 0);
  assert.equal(calls, 0);
  listener({ code: "Space", key: " ", target: {}, preventDefault: () => calls++ });
  assert.equal(dash, 1);
  assert.equal(calls, 1);
});
