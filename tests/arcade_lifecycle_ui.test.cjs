const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const html = readFileSync(join(__dirname, "../ui/index.html"), "utf8");
function slice(start, end) {
  const i = html.indexOf(start);
  const j = html.indexOf(end, i + start.length);
  assert(i >= 0 && j >= 0, start);
  return html.slice(i, j);
}
function harness(active) {
  function dom(id, classNames = [], dataset = {}) {
    const set = new Set(classNames);
    return {
      id, dataset, textContent: id + " - initial copy", events: {},
      classList: {
        contains: key => set.has(key),
        add: key => set.add(key),
        remove: key => set.delete(key),
        toggle: (key, enabled) => enabled ? set.add(key) : set.delete(key),
      },
      addEventListener(key, fn) { this.events[key] = fn; },
    };
  }
  const games = ["blaster", "rain"];
  const tabs = games.map(game => dom(game, game === active ? ["active"] : [], { game }));
  const panes = games.map(game => dom("arcPane-" + game, game === active ? ["active"] : []));
  const nodes = Object.fromEntries([
    dom("arcadeModal", ["open"]), dom("arcadeBtn"), dom("arcadeCloseBtn"), dom("blEndBtn"), ...panes,
    ...["blAmmo","blFireRate","blRefund","blBest","rainTierLbl","rainSpeedLbl","rainBest"].map(id => dom(id)),
    ...games.flatMap(game => [
      dom(game + "Title"), dom(game + "Desc"), dom(game + "StartBtn"), dom(game + "Overlay"),
    ]),
  ].map(node => [node.id, node]));
  nodes[active + "Overlay"].classList.add("hidden");

  const frames = new Map(), canceled = [];
  const round = { running: true, score: 1065, elapsed: 16.6, hordeTimer: 6.6, lastTs: 22, lives: 3 };
  const tick = { blaster: () => {}, rain: () => {} };
  frames.set(0, tick[active]);  // requestAnimationFrame IDs may be zero.
  let seq = 0, now = 9999;
  const ctx = {
    window: {}, nodes, state: {data: null}, popoverVisible: true, minimalMode: false,
    performance: {now: () => now}, disconnectStream() {}, syncSlidePill() {},
    debugState: {}, renderAdventurePropBars() {}, renderBackdropBar() {}, renderAlchemyStats() {}, renderGachaMeta() {},
    getBlasterLoadout: () => ({ammo:50, fireHz:4, cannons:1, refundProb:0.05}),
    getBunnyTier: () => ({level:1, name:"test"}), getEffectiveTodayTokens: () => 5,
    localStorage: {getItem: () => null},
    document: {
      getElementById: id => nodes[id],
      querySelectorAll: sel => sel === ".arcade-pane" ? panes : tabs,
    },
    blasterRaf: active === "blaster" ? 0 : null, rainRaf: active === "rain" ? 0 : null,
    blasterState: active === "blaster" ? round : null, rainState: active === "rain" ? round : null,
    tickBlasterGame: tick.blaster, tickRainGame: tick.rain,
    blKeys: {left: true, right: true}, rainKeys: {left: true, right: true},
    requestAnimationFrame: fn => { frames.set(++seq, fn); return seq; },
    cancelAnimationFrame: id => { canceled.push(id); frames.delete(id); },
  };
  vm.createContext(ctx);
  vm.runInContext(
    slice("window.__onPopoverOpen =", 'document.addEventListener("visibilitychange"') +
    slice("const arcadeStartCopy =", "function getBlasterLoadout()") +
    slice("function refreshArcadeContext()", "// ADVENTURE STAGE BACKDROPS") +
    slice("function stopBlasterGame()", "function spawnSpecialBoss(") +
    slice("function stopRainGame()", "function startRainGame()") +
    slice("function advanceBlasterHordeWarning(", "function spawnHordeFormation("), ctx,
  );
  return { ctx, nodes, tabs, frames, canceled, tick, round, setNow: value => now = value,
    scheduledGameFrames: () => [...frames].filter(([, fn]) => fn === tick.blaster || fn === tick.rain) };
}

for (const game of ["blaster", "rain"]) {
  test(game + ": native popover pause preserves the active round; reopen resumes once with current timestamp", () => {
    const h = harness(game);
    h.ctx.window.__onPopoverClose();
    h.ctx.window.__onPopoverClose();
    assert.deepEqual(h.canceled, [0]);
    assert.equal(h.ctx[game+"Raf"], null);
    assert(h.round.pausedForPopover && !h.round.running);
    assert(h.nodes[game+"Overlay"].classList.contains("hidden"));
    assert(h.nodes.arcadeModal.classList.contains("open"));
    assert.equal(h.round.elapsed, 16.6);
    assert.equal(h.round.score, 1065);
    assert.deepEqual(h.ctx.blKeys, {left:false,right:false});
    assert.deepEqual(h.ctx.rainKeys, {left:false,right:false});
    h.ctx.window.__onPopoverOpen();
    const id = h.ctx[game+"Raf"];
    assert.equal(h.round.lastTs, 9999);
    assert.equal(h.ctx[game+"State"], h.round);
    assert(h.round.running && !h.round.pausedForPopover);
    h.setNow(12345);
    h.ctx.window.__onPopoverOpen();
    assert.equal(h.round.lastTs, 9999);
    assert.deepEqual(h.scheduledGameFrames(), [[id,h.tick[game]]]);
    h.ctx.window.__onPopoverClose();
    h.ctx.window.__onPopoverOpen();
    assert.equal(h.round.lastTs, 12345);
    assert.equal(h.scheduledGameFrames().length, 1);
    assert.notEqual(h.ctx[game+"Raf"], id);
  });

  test(game + ": intentional exit restores start copy and never resumes a discarded paused round", () => {
    const h = harness(game);
    h.nodes[game+"StartBtn"].textContent = "obsolete result label";
    h.ctx.window.__onPopoverClose();
    h.nodes.arcadeCloseBtn.events.click();
    assert.equal(h.ctx[game+"State"], null);
    assert.equal(h.nodes[game+"StartBtn"].textContent, game+"StartBtn - initial copy");
    assert(!h.nodes[game+"Overlay"].classList.contains("hidden"));
    assert(!h.nodes.arcadeModal.classList.contains("open"));
    h.ctx.window.__onPopoverOpen();
    h.nodes.arcadeBtn.events.click();
    assert(h.nodes.arcadeModal.classList.contains("open"));
    assert.equal(h.scheduledGameFrames().length, 0);
  });

  test(game + ": selecting the same tab is safe, switching tabs abandons the old round and shows start", () => {
    const h = harness(game);
    h.tabs.find(t => t.dataset.game === game).events.click();
    assert.equal(h.ctx[game+"State"], h.round);
    assert.equal(h.scheduledGameFrames().length, 1);
    h.tabs.find(t => t.dataset.game !== game).events.click();
    assert.equal(h.ctx[game+"State"], null);
    assert(!h.nodes[game+"Overlay"].classList.contains("hidden"));
    assert.equal(h.scheduledGameFrames().length, 0);
    h.ctx.window.__onPopoverClose();
    h.ctx.window.__onPopoverOpen();
    assert.equal(h.scheduledGameFrames().length, 0);
  });
}

test("telemetry refresh does not replace the paused shooter's loadout", () => {
  const h = harness("blaster");
  h.nodes.blAmmo.textContent = "7 发";
  h.nodes.blFireRate.textContent = "9/s ×3管";
  h.nodes.blRefund.textContent = "28%";
  h.ctx.window.__onPopoverClose();
  h.ctx.refreshArcadeContext();
  assert.equal(h.nodes.blAmmo.textContent, "7 发");
  assert.equal(h.nodes.blFireRate.textContent, "9/s ×3管");
  assert.equal(h.nodes.blRefund.textContent, "28%");
  h.nodes.arcadeCloseBtn.events.click();
  h.ctx.refreshArcadeContext();
  assert.equal(h.nodes.blAmmo.textContent, "50 发");
});

test("a paused horde neither loses nor duplicates its entrance pickup across repeated resumes", () => {
  const h = harness("blaster");
  Object.assign(h.round, { hordeState: "warn", hordeCount: 3, hordeTimer: .04,
    pickups: [], floats: [], berserkTimer: 0, w: 370, x: 120 });
  h.ctx.window.__onPopoverClose();
  assert.equal(h.round.pickups.length, 0);
  h.ctx.window.__onPopoverOpen();
  h.ctx.advanceBlasterHordeWarning(h.round, .05);
  assert.equal(h.round.pickups.length, 1);
  assert.equal(h.round.pickups[0].kind, "berserk_orb");
  h.ctx.window.__onPopoverClose();
  h.ctx.window.__onPopoverOpen();
  h.ctx.window.__onPopoverOpen();
  h.ctx.advanceBlasterHordeWarning(h.round, .05);
  assert.equal(h.round.pickups.length, 1);
});
