const {readFileSync} = require("node:fs");
const assert = require("node:assert/strict");
const {join} = require("node:path");
const {test} = require("node:test");
const vm = require("node:vm");
const html = readFileSync(join(__dirname, "../ui/index.html"), "utf8");
function chunk(a,b) {
  const i = html.indexOf(a), j = html.indexOf(b,i+a.length);
  assert(i>=0 && j>=0, a);
  return html.slice(i,j);
}
function harness() {
  let roll = .99;
  const math = Object.create(Math), awarded = [], written = [], canceled = [], sfx=[];
  math.random = () => roll;
  const nodes = new Map();
  const ctx = vm.createContext({
    Math: math, blasterRaf: 0, blKeys:{left:true,right:true},
    spawnBlasterParts(){}, spawnConfettiBurst(){}, playSfx: key=>sfx.push(key),
    grantAdventureCoins: amount => {awarded.push(amount); return Math.min(1,amount);},
    cancelAnimationFrame: id => canceled.push(id),
    localStorage: {getItem:()=>0, setItem:(...x)=>written.push(x)},
    document: {getElementById(id){
      if (!nodes.has(id)) nodes.set(id, {id, hidden:false, textContent:"",
        classList:{remove: c => nodes.get(id).removed = c}, querySelector(){return {}}, addEventListener(_, fn){this.click=fn;}});
      return nodes.get(id);
    }}, startBlasterGame(){}, frozen:false, hasActiveBoss:true, wave:2, dt:.05,
  });
  vm.runInContext(chunk("function advanceBlasterHordeWarning(", "function spawnHordeFormation(") +
    chunk("function handleBlasterEnemyDeath(", "function triggerBlasterNova(") +
    chunk("function finishBlasterGame(", "// GAME 1: 🥕 TOKEN RAIN CATCHER"),ctx);
  const game = extra => ({
    running:true, w:400, h:248, x:12, elapsed:40, hordeCount:1, hordeTimer:.05, hordeState:"warn",
    hordeWaveAcc:0, hordeEliteSpawned:true, nextBossAt:0, hordeSurvived:true,
    lives:3, ammo:20, kills:0, combo:0, score:0, bossKills:0, berserkCharge:0, berserkTimer:0,
    feverCharge:0, overclockTimer:0, refunded:0, lootsFound:[], floats:[], pickups:[], enemies:[],
    ...extra,
  });
  return {ctx, nodes, awarded, written, canceled, sfx, game,setRoll: v=>roll=v};
}
function enemy(extra) {
  return {x:140,y:50,pts:5,col:"red",...extra};
}

test("ordinary core and ammo drops get rarer without stealing coin, mystery, or shield odds", () => {
  const h=harness();
  // Exhaust 1,000 equal-width centile midpoints; deterministic and substantially
  // finer than the rarest class, including 1.8% regular cores.
  const samples=[
    [{}, {gacha_box:22,carrot_coin:32,berserk_orb:18,shield_pack:18,ammo:70}],
    [{horde:true}, {gacha_box:22,carrot_coin:32,berserk_orb:35,shield_pack:55,ammo:70}],
    [{kind:"tank",horde:true}, {gacha_box:22,carrot_coin:32,berserk_orb:180,shield_pack:55,ammo:70}],
    [{split:true},{gacha_box:55,carrot_coin:60,berserk_orb:18,shield_pack:18,ammo:70}],
  ];
  for(const [shape, expected] of samples) {
    const got={};
    for(let i=0; i<1000; i++) {
      h.setRoll((i+.5)/1000);
      const s=h.game();
      h.ctx.handleBlasterEnemyDeath(s,enemy(shape),2);
      assert(s.pickups.length <= 1);
      const [pk]=s.pickups;
      if (!pk) continue;
      got[pk.kind]=(got[pk.kind]??0)+1;
      if(pk.kind==="ammo") assert.equal(pk.amt,8);
    }
    assert.deepEqual(got,expected);
  }
  h.setRoll(0);
  const elite=h.game(), boss=h.game(), decoy=h.game();
  h.ctx.handleBlasterEnemyDeath(elite,enemy({kind:"elite",horde:true}),2);
  h.ctx.handleBlasterEnemyDeath(boss,enemy({boss:true}),2);
  h.ctx.handleBlasterEnemyDeath(decoy,enemy({boss:true,isDecoy:true}),2);
  assert.equal(JSON.stringify(elite.pickups.map(p=>[p.kind,p.amt])), '[["ammo",8]]');
  assert.equal(JSON.stringify(boss.pickups.map(p=>p.kind)), '["carrot_coin","gacha_box"]');
  assert.equal(decoy.pickups.length,0);
});

test("each wave entrance provides exactly one catchable combat-only pack", () => {
  const h=harness();
  for(const [count,timer,kind] of [[1,0,"shield_pack"],[2,0,"shield_pack"],
    [3,0,"berserk_orb"],[6,5,"shield_pack"]]) {
    const s=h.game({hordeCount:count,berserkTimer:timer,hordeTimer:.06});
    h.ctx.advanceBlasterHordeWarning(s,.03);
    assert.equal(s.pickups.length,0);
    for(let i=0;i<6;i++) h.ctx.advanceBlasterHordeWarning(s,.05);
    assert.equal(s.pickups.length,1);
    assert.equal(s.pickups[0].kind,kind);
    assert(s.pickups[0].x>=24 && s.pickups[0].x<s.w);
    assert.equal(Math.abs(s.pickups[0].x-s.x),48);
    assert.match(s.floats[0].txt,/敌潮补给/);
    assert((s.h-26-s.pickups[0].y-34)/s.pickups[0].vy < 2);
    assert.equal(s.hordeTimer,9.5);
    assert.equal(s.hordeState,"active");
  }
});

test("a cleared horde gives 6 ammo; overclock cannot recharge while active", () => {
  const h=harness();
  h.ctx.s=h.game({hordeState:"active",hordeTimer:.01,hordeWaveAcc:0});
  vm.runInContext(chunk("  // Periodic Enemy Horde", '    if (s.hordeState === "idle" && !hasActiveBoss && s.elapsed >= s.nextBossAt)')+"\n}",h.ctx);
  assert.equal(h.ctx.s.ammo,26);
  assert.equal(h.ctx.s.score,200);
  assert.match(h.ctx.s.bossBanner.txt,/补弹 \+6/);
  const s=h.game({feverCharge:92,overclockTimer:.5});
  for(let n=0;n<20;n++) h.ctx.handleBlasterEnemyDeath(s,enemy({}),3);
  assert.equal(s.feverCharge,92);
  assert.equal(s.overclockTimer,.5);
  s.overclockTimer=0;
  h.ctx.handleBlasterEnemyDeath(s,enemy({}),3);
  assert.equal(s.feverCharge,99);
  h.ctx.handleBlasterEnemyDeath(s,enemy({}),3);
  assert.equal(s.feverCharge,0);
  assert.equal(s.overclockTimer,4.5);
});

test("End Round settles the same report and capped coin grant only once", () => {
  const h=harness();
  const s=h.game({score:1805,lootsFound:["珍宝"],coinsCaught:2});
  h.ctx.blasterState=s;
  const stop=h.nodes.get("blEndBtn");
  stop.click();
  stop.click();
  h.ctx.finishBlasterGame(s,"natural completion");
  assert.equal(s.running,false);
  assert.equal(h.ctx.blasterRaf,null);
  assert.equal(stop.hidden,true);
  assert.deepEqual(h.canceled,[0]);
  assert.deepEqual(h.awarded,[2]); // production grantAdventureCoins owns the daily cap
  assert.deepEqual(h.written,[["tootoo_blaster_best","1805"]]);
  assert.equal(h.nodes.get("blasterOverlay").removed,"hidden");
  assert.match(h.nodes.get("blasterTitle").textContent,/1805/);
  assert.match(h.nodes.get("blasterDesc").textContent,/已主动结束本局。.*本局共赢 \+3.*珍宝/);
  const debug=h.game({score:5000,debugTainted:true});
  h.ctx.finishBlasterGame(debug,"ended");
  assert.equal(h.awarded.length,1);
  assert.equal(h.written.length,1);
});
