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
function harness(seed) {
  let roll = .99;
  const math = Object.create(Math), awarded = [], written = [], canceled = [], sfx=[];
  math.random = () => seed == null ? roll : ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2**32);
  const nodes = new Map();
  const ctx = vm.createContext({
    Math: math, blasterRaf: 0, blKeys:{left:true,right:true},
    spawnBlasterParts(){}, spawnConfettiBurst(){}, playSfx: key=>sfx.push(key),
    grantAdventureCoins: amount => {awarded.push(amount); return Math.min(1,amount);},
    cancelAnimationFrame: id => canceled.push(id),
    localStorage: {getItem:()=>0, setItem:(...x)=>written.push(x)},
    document: {getElementById(id){
      if (!nodes.has(id)) nodes.set(id, {id, hidden:false, textContent:"",
        classList:{add() {}, remove: c => nodes.get(id).removed = c}, querySelector(){return {}}, addEventListener(_, fn){this.click=fn;}});
      return nodes.get(id);
    }}, startBlasterGame(){}, frozen:false, hasActiveBoss:true, wave:2, dt:.05,
  });
  vm.runInContext(chunk("const BLASTER_BERSERK_SECONDS", "function spawnHordeFormation(") +
    chunk("function handleBlasterEnemyDeath(", "function triggerBlasterNova(") +
    chunk("function finishBlasterGame(", "// GAME 1: 🥕 TOKEN RAIN CATCHER"),ctx);
  const game = extra => ({
    running:true, w:400, h:248, x:12, elapsed:40, hordeCount:1, hordeTimer:.05, hordeState:"warn",
    hordeWaveAcc:0, hordeEliteSpawned:true, nextBossAt:0, hordeSurvived:true,
    lives:3, breaches:0, shieldCharge:0, shieldTimer:0, maxAmmo:85, ammo:20, kills:0, combo:0, score:0, bossKills:0, berserkCharge:0, berserkTimer:0,
    feverCharge:0, overclockTimer:0, refunded:0, lootsFound:[], floats:[], pickups:[], enemies:[],
    ...extra,
  });
  return {ctx, nodes, awarded, written, canceled, sfx, game,setRoll: v=>roll=v};
}
function enemy(extra) {
  return {x:140,y:50,pts:5,col:"red",...extra};
}

test("random loot keeps coins and boxes but cannot chain defense or rage", () => {
  const h=harness();
  // Enumerate 1,000 evenly spaced drop rolls for each enemy type.
  const samples=[
    [{}, {gacha_box:22,carrot_coin:32,ammo:32}],
    [{horde:true}, {gacha_box:22,carrot_coin:32,ammo:32}],
    [{kind:"tank",horde:true}, {gacha_box:22,carrot_coin:32,ammo:32}],
    [{split:true},{gacha_box:55,carrot_coin:60,ammo:32}],
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
      if(pk.kind==="ammo") assert.equal(pk.amt,4);
    }
    assert.deepEqual(got,expected);
  }
  h.setRoll(0);
  const elite=h.game(), boss=h.game(), decoy=h.game();
  h.ctx.handleBlasterEnemyDeath(elite,enemy({kind:"elite",horde:true}),2);
  h.ctx.handleBlasterEnemyDeath(boss,enemy({boss:true}),2);
  h.ctx.handleBlasterEnemyDeath(decoy,enemy({boss:true,isDecoy:true}),2);
  assert.equal(JSON.stringify(elite.pickups.map(p=>[p.kind,p.amt])), '[["ammo",5]]');
  assert.equal(JSON.stringify(boss.pickups.map(p=>p.kind)), '["carrot_coin","gacha_box"]');
  assert.equal(decoy.pickups.length,0);
});

test("each horde provides exactly one catchable combat-only pack", () => {
  const h=harness();
  for(const [count,timer,kind] of [[1,0,"ammo"],[2,0,"shield_pack"],
    [3,0,"berserk_orb"],[6,3,"berserk_orb"]]) {
    const s=h.game({hordeCount:count-1,berserkTimer:timer});
    h.ctx.triggerBlasterHorde(s,2);
    assert.equal(s.pickups.length,count===1 ? 1 : 0);
    s.hordeTimer=.06;
    h.ctx.advanceBlasterHordeWarning(s,.03);
    assert.equal(s.pickups.length,count===1 ? 1 : 0);
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

function live(seed, {tps=72,cache_hit=95,tokens=200e6,level=3,width=392}={}) {
  const h=harness(seed), root=h.ctx;
  Object.assign(root, {
    state:{data:{kpi:{tps,cache_hit}}}, debugState:{active:false},
    getEffectiveTodayTokens:()=>tokens, getBunnyTier:()=>({level}),
    performance:{now:()=>0}, blasterState:null, playTone(){},
    requestAnimationFrame:()=>1, window:{}, blasterCanvas:{clientWidth:width}, blCtx:{setTransform(){}},
    blKeys:{left:false,right:false}, rollInGameMysteryLoot:()=>({icon:"",actualName:"",r:"N"}),
  });
  vm.runInContext(chunk("function getBlasterLoadout(", "function refreshArcadeContext(") +
    chunk("function spawnHordeFormation(", "function spawnBlasterParts(") +
    chunk("function hitBlasterDefense(", "  // Render blaster canvas") +
    chunk("  // End check (never end from 0 ammo", "function finishBlasterGame("), root);
  root.startBlasterGame();
  return {...h, root,s:root.blasterState};
}

test("initial ammo and refunds stay bounded even on very high usage days", () => {
  assert.equal(live(1,{tokens:0,cache_hit:0}).s.ammo,85);
  const low=live(1,{tokens:12e6}).s, high=live(1,{tokens:64e9,cache_hit:100,level:9}).s;
  assert.ok(low.ammo > 85 && low.ammo < high.ammo);
  assert.equal(high.ammo,185);
  assert.equal(high.refundProb,.18);
});

test("even a dry minimum loadout gets to its first pack at maximum rate", () => {
  const {root,s}=live(7,{tps:200,tokens:0,cache_hit:0,level:1});
  let pack, caught=false;
  for(let frame=1; frame<680 && !caught; frame++){
    root.tickBlasterGame(frame*1000/60);
    s.enemies.length=0;
    s.enemyBullets.length=0;
    if(!pack && s.pickups.length) { pack=s.pickups[0]; s.targetX=pack.x; }
    if(pack && !s.pickups.includes(pack)) caught=true;
  }
  assert.equal(pack.kind,"ammo");
  assert.equal(pack.amt,10);
  assert.ok(caught && s.ammo>0 && s.running);
});

test("three leaks cost a heart, full rage never saves a hit, shields spend on one hit, and rage cannot extend", () => {
  const {root,s}=live(7);
  s.berserkCharge=100;
  s.shieldCharge=1;
  const leak=()=>s.enemies.push({x:50,y:s.h-9,hp:2,r:9,vy:0,wobble:0,lbl:"BUG"});
  for(let frame=1;frame<=6;frame++){
    leak();
    root.tickBlasterGame(frame*17);
    assert.equal(s.lives,frame===6?2:3);
    assert.equal(s.berserkTimer,0);
    assert.equal(s.breaches,frame%3);
    assert.equal(s.shieldCharge,frame<3?1:0);
  }
  s.enemyBullets.push({x:s.x,y:s.h-26,vx:0,vy:0,r:4});
  root.tickBlasterGame(7*17);
  assert.equal(s.lives,1);
  assert.equal(s.berserkTimer,0);
  assert.equal(root.triggerBlasterBerserk(),true);
  assert.equal(s.berserkTimer,3);
  assert.equal(root.triggerBlasterBerserk(),false);
  assert.equal(root.triggerBlasterBerserk(true),false);
  assert.equal(s.berserkTimer,3);
  assert.equal(s.berserkCharge,0);
  s.berserkTimer=0; s.berserkCharge=100;
  s.elapsed=s.berserkReadyAt-.1;
  assert.equal(root.triggerBlasterBerserk(),false);
  s.elapsed=s.berserkReadyAt;
  assert.equal(root.triggerBlasterBerserk(),true);
});

test("rage pickup charges without activating; the horde clear does not refill ammo", () => {
  const {root,s}=live(7);
  s.pickups.push({kind:"berserk_orb",x:s.x,y:s.h-26,vy:0});
  root.tickBlasterGame(16);
  assert.equal(s.berserkCharge,45);
  assert.equal(s.berserkTimer,0);
  s.hordeState="active"; s.hordeTimer=.01; s.hordeEliteSpawned=true;
  const ammo=s.ammo;
  root.tickBlasterGame(32);
  assert.equal(s.ammo,ammo);
  assert.equal(s.score,200);
  assert.match(s.bossBanner.txt,/防线守住/);
});

test("overclock cannot recharge while active; it lasts under three seconds", () => {
  const h=harness(), s=h.game({feverCharge:96,overclockTimer:.5});
  for(let n=0;n<20;n++) h.ctx.handleBlasterEnemyDeath(s,enemy({}),3);
  assert.equal(s.feverCharge,96);
  s.overclockTimer=0;
  h.ctx.handleBlasterEnemyDeath(s,enemy({}),3);
  assert.equal(s.feverCharge,0);
  assert.equal(s.overclockTimer,2.8);
});

test("later formations are thicker, tougher and arrive faster", () => {
  const {root,s}=live(7);
  const early=root.blasterWavePacing(1,true,false), late=root.blasterWavePacing(8,true,false);
  assert(late.interval < early.interval && late.formation < early.formation);
  assert.equal(late.cap,36);
  assert(root.blasterEnemyHp(s,8,2) >= root.blasterEnemyHp(s,1,2)+2);
  root.Math.random=()=>0.1;
  root.spawnHordeFormation(s,1);
  assert.equal(s.enemies.length,5);
  s.enemies=[];
  root.spawnHordeFormation(s,8);
  assert.equal(s.enemies.length,7);
  assert(s.enemies.every(e=>e.hp>=4 && e.hp===e.maxHp));
});

test("inventory caps actual uses without discarding redundant items or changing rain", () => {
  const {root,s}=live(7);
  let bag={arcade_items:{ammo_box:8,energy_shield:8,time_freeze:8}};
  Object.assign(root,{getActiveHomeState:()=>bag,cloneHomeState:x=>JSON.parse(JSON.stringify(x)),
    saveActiveHomeState:x=>{bag=x},rainState:{running:true,shields:0,floats:[],w:392,h:248,x:192}});
  vm.runInContext(chunk("const ADVENTURE_PROPS", '["blPropBar", "rainPropBar"].forEach'),root);
  assert.equal(root.useAdventureProp("blaster","ammo_box"),false);
  assert.equal(bag.arcade_items.ammo_box,8);
  assert.equal(root.useAdventureProp("blaster","energy_shield"),true);
  assert.equal(root.useAdventureProp("blaster","energy_shield"),false);
  s.ammo-=25;
  assert.equal(root.useAdventureProp("blaster","ammo_box"),true);
  assert.equal(s.ammo,s.maxAmmo-7);
  assert.equal(root.useAdventureProp("blaster","time_freeze"),false);
  assert.equal(bag.arcade_items.time_freeze,8);
  assert.equal(bag.arcade_items.energy_shield,7);
  assert.equal(root.useAdventureProp("rain","energy_shield"),true);
  assert.equal(root.rainState.shields,2);
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

function simulate(seed, config, active) {
  const {root,s}=live(seed,config);
  let rageFrames=0, peak=0, waves=0, missiles=0, target=s.x;
  for(let frame=1; frame<=60*180 && s.running; frame++) {
    if(active && frame%9===1) {
      const by=s.h-26;
      const threats=s.enemies.filter(e=>e.y>-10).map(e=>[
        Math.max(22,Math.min(s.w-22,e.x+(e.diveState==="dive"?e.vx*.22:0))),
        e.boss? 3 : 2+Math.min(8,e.y/25)-e.hp*.28,
      ]);
      for (const p of s.pickups) {
        if (p.y > by-69 && p.y < by+18 && (p.kind!=="ammo" || s.ammo<s.maxAmmo-6)) {
          threats.push([p.x,p.kind==="ammo" && s.ammo<25?13:8]);
        }
      }
      if(threats.length){
        const bullets=s.enemyBullets.filter(e=>e.y>by-80 && e.y<by+7);
        const risk=x=>bullets.reduce((v,b)=>v+(Math.abs(x-b.x-b.vx*.14)<26?7:0),0);
        const value=([x,v])=>v-Math.abs(x-s.x)/90-risk(x);
        target=threats.reduce((best,x)=>value(x)>value(best)?x:best)[0];
      }
      s.targetX=target;
      if(s.berserkCharge>=100 && (s.enemies.length>=4 || s.enemies.some(e=>e.boss))) root.triggerBlasterBerserk();
      if(!s.berserkTimer && s.ammo>40 && s.enemies.filter(e=>e.y>145).length>=5) root.triggerBlasterNova();
    }
    root.tickBlasterGame(frame*1000/60);
    rageFrames+= +(s.berserkTimer>0);
    peak=Math.max(peak,s.enemies.length);
    waves=Math.max(waves,s.hordeCount);
    missiles=Math.max(missiles,s.enemyBullets.length);
  }
  return {seconds:s.elapsed,kills:s.kills,score:s.score,rage:rageFrames/(s.elapsed*60),peak,waves,lives:s.lives,ammo:s.ammo,missiles,running:s.running};
}

test("fixed-seed real rounds remain survivable with aim, but not endless", () => {
  const results={};
  for(const [id,config] of [
    ["new",{tokens:0,cache_hit:0,level:1}],
    ["mid",{tokens:200e6,cache_hit:95,level:3}],
    ["high",{tokens:8e9,tps:200,cache_hit:100,level:9}],
  ]){
    const pairs=Array.from({length:12},(_,i)=>[simulate(i+1,config,false),simulate(i+1,config,true)]);
    const median=(xs)=>[...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)];
    const passive=median(pairs.map(x=>x[0].seconds)), aimed=median(pairs.map(x=>x[1].seconds));
    const longest=Math.max(...pairs.map(x=>x[1].seconds));
    assert(aimed > passive * 1.7 && aimed > 20, id + ": aiming should matter");
    assert(longest < 100 && pairs.every(([,round])=>!round.running), id + ": skilled play must not run indefinitely");
    assert(pairs.every(([,round])=>round.rage < .29), id + ": rage must not dominate");
    results[id]={passive,aimed,longest,minAimed:Math.min(...pairs.map(x=>x[1].seconds)),maxRage:Math.max(...pairs.map(x=>x[1].rage)),maxKills:Math.max(...pairs.map(x=>x[1].kills))};
  }
  console.log("Balance sample:",JSON.stringify(results));
});
