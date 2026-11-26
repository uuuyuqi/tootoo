const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const art = require('../ui/tootoo_arcade_scenes.js');
const html = fs.readFileSync(path.join(__dirname,'../ui/index.html'),'utf8');
const segment = html.slice(html.indexOf('const ADVENTURE_BACKDROPS = ['), html.indexOf('const ADVENTURE_DAILY_COIN_CAP'));
function traceCanvas() {
  const ops = [];
  const gradient = {addColorStop(...args) { ops.push(['stop', ...args]); }};
  const ctx = new Proxy({canvas:null}, {
    get(target,key) { return key in target ? target[key] : (...args) => {
      ops.push([key,...args]);
      if (key.startsWith('create')) return gradient;
    }; },
    set(target,key,value) { target[key]=value; ops.push(['set',key,value]); return true; },
  });
  return {ctx,ops};
}

test('all five SSR scenery renderers are visually distinct and have position-sensitive reactions', () => {
  assert.equal(art.themes.length, 5);
  const styles = new Set();
  for (const {id,r,interactive} of art.themes) {
    assert.equal(r,'SSR'); assert.equal(interactive,true);
    const idle=traceCanvas(), a=traceCanvas(), b=traceCanvas();
    assert.equal(art.draw(idle.ctx,id,440,180,1800,null),true);
    art.draw(a.ctx,id,440,180,1800,{x:155,y:98,age:.36});
    art.draw(b.ctx,id,440,180,1800,{x:277,y:98,age:.36});
    assert.notDeepEqual(a.ops,idle.ops);
    assert.notDeepEqual(a.ops,b.ops);
    assert.equal(a.ops[0][0],'save'); assert.equal(a.ops.at(-1)[0],'restore');
    styles.add(JSON.stringify(idle.ops.filter(op=>op[0]==='stop')));
  }
  assert.equal(styles.size,5);
  assert.equal(art.draw(traceCanvas().ctx,'constructor',1,1,0,null),false);
});

function fixture(reduceMotion = false) {
  const scenes = art.themes.map(t=>t.id);
  const makeNode = () => ({
    hidden:true, dataset:{}, handlers:{}, scrollLeft:0,
    addEventListener(type,fn) { this.handlers[type]=fn; },
    contains() { return false; }, querySelector() { return null; },
  });
  const nodes = Object.fromEntries(['arcadeModal','advBackdropBar','advScenePreview','advSceneControl','advSceneHint','advSceneActivate'].map(id=>[id,makeNode()]));
  const { ctx }=traceCanvas();
  const draws=[], q=new Map(), saves=[];
  let now=1000, raf=0;
  nodes.arcadeModal.classList={ contains:()=>true };
  const cv=nodes.advScenePreview;
  ctx.canvas=cv;
  Object.assign(cv,{width:880,height:256,getContext:()=>ctx,getBoundingClientRect:()=>({left:20,top:40,width:440,height:128})});
  const initial = {owned_backdrops:['paper','golden_citadel',...scenes.slice(0,4)],active_backdrop:'golden_citadel'};
  let home = structuredClone(initial);
  const doc = {hidden:false, activeElement:null, getElementById:id=>nodes[id], addEventListener: (t,fn)=>nodes.arcadeModal.handlers[t]=fn};
  const cfg = {
    TooTooArcadeScenes:{...art,draw(...args){draws.push(args); return art.draw(...args);}},
    document:doc, debugState:{unlockAll:false}, window:{matchMedia:()=>({matches:reduceMotion})},
    getActiveHomeState:()=>home, cloneHomeState:structuredClone, playSfx:()=>{}, isPopover:true,popoverVisible:true,
    saveActiveHomeState:(h,spent)=>{home=h;saves.push({h,spent});},
    performance:{now:()=>now}, requestAnimationFrame:cb=>{q.set(++raf,cb);return raf;},
    cancelAnimationFrame:id=>q.delete(id),
  };
  const page = vm.createContext(cfg);
  vm.runInContext(segment,page);
  page.renderBackdropBar();
  return {page,nodes,draws,q,saves,scenes,initial,
    open(id) { nodes.advBackdropBar.handlers.click({target:{closest:()=>({dataset:{bgId:id}})}}); },
    trigger() { nodes.advSceneActivate.handlers.click({currentTarget:nodes.advSceneActivate}); },
    tick(delta) { now+=delta; const entries=[...q.values()]; q.clear(); entries.forEach(cb=>cb(now)); },
    getHome:()=>home,
  };
}
test('arcade gallery preserves old scenes, blocks locked scenes and interacts only with owned sets', () => {
  const h=fixture();
  assert.equal(h.nodes.advSceneControl.hidden,true);
  assert.match(h.nodes.advBackdropBar.innerHTML,/黄金星穹殿/);
  const markup=h.nodes.advBackdropBar.innerHTML;
  const locked=art.themes.at(-1);
  assert.match(markup,/🔒 未解锁/);
  for (const spoiler of [locked.id,locked.name,locked.desc,locked.icon,locked.swatch]) assert(!markup.includes(spoiler));
  h.open('constructor');
  h.open(h.scenes.at(-1));
  assert.equal(h.saves.length,0);
  h.open(h.scenes[0]);
  assert.equal(h.getHome().active_backdrop,h.scenes[0]);
  assert.equal(h.saves.length,1);
  assert.equal(h.saves[0].spent,0);
  assert.equal(h.nodes.advSceneControl.hidden,false);
  assert.equal(h.nodes.advSceneActivate.textContent,'引动月潮');
  h.trigger();
  assert.equal(h.q.size,1);
  h.tick(300);
  assert.equal(h.draws.at(-1)[1],h.scenes[0]);
  assert.ok(h.draws.at(-1)[5].age>0);
  h.tick(2200);
  assert.equal(h.q.size,0,'preview does not spin indefinitely');
  assert.equal(h.draws.at(-1)[5],null);
  h.trigger();
  h.open(h.scenes[1]);
  assert.equal(h.q.size,0);
  assert.equal(h.nodes.advScenePreview.hidden,true);
  h.trigger();
  h.page.document.hidden=true;
  h.nodes.arcadeModal.handlers.visibilitychange();
  assert.equal(h.q.size,0);
  assert.equal(h.nodes.advScenePreview.hidden,true);
  assert.equal(h.saves.length,2,'visual reactions never write wallet or save state');
});
test('reduced motion provides one static reaction frame and no extra RAF', () => {
  const h=fixture(true);
  h.open(h.scenes[0]);
  h.trigger();
  assert.equal(h.draws.length,1);
  assert.ok(h.draws[0][5].age>0);
  assert.equal(h.q.size,0);
});
