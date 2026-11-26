const assert = require("node:assert/strict");
const {test} = require("node:test");
const {readFileSync} = require("node:fs");
const vm = require("node:vm");
const html = readFileSync(new URL("../ui/index.html", "file://" + __filename), "utf8");
const code = html.split("// TOOTOO_ADVENTURE_TICKETS_START\n")[1].split("// TOOTOO_ADVENTURE_TICKETS_END")[0];
const snapshot = (available, balance=10, buy_remaining=4) => ({ok:true,tickets:{
  available,expires_next_at:available ? 1910000000 : null,bought_today:5-buy_remaining,buy_remaining,price:5,daily_free:3,ttl_days:7,
},balance});
const resp = (value,status=200) => ({ok:status===200,status,json:async()=>value});
function fixture() {
  const nodes = {};
  const disk = new Map(), storage={getItem:k=>disk.get(k),setItem:(k,v)=>disk.set(k,v),removeItem:k=>disk.delete(k)};
  const f={visible:true,active:"blaster",starts:[],requests:[],responses:[],reads:0,renders:0};
  const context=vm.createContext({
    document:{hidden:false,getElementById:id=>nodes[id]??(nodes[id]={
      addEventListener:(type,cb)=>{nodes[id][type]=cb;},
      classList:{contains:kind=>kind==="open"?f.visible:("arcPane-"+f.active)===id},
    })},
    localStorage:storage,sessionStorage:storage,crypto:require("node:crypto").webcrypto,debugState:{active:false},
    isPopover:true,popoverVisible:true,blasterState:null,rainState:null,carrotRevision:0,
    carrotDiskState:{balance:15},carrotWriteTail:Promise.resolve(),
    startBlasterGame:()=>f.starts.push("blaster"),startRainGame:()=>f.starts.push("rain"),
    syncCarrotFromDisk:()=>{f.reads++;},renderGachaMeta:()=>{f.renders++;},
    fetch:async(path,opts)=>{
      assert.equal(path,"/api/adventure/tickets");
      f.requests.push(opts.body?JSON.parse(opts.body):"GET");
      const next=f.responses.shift();
      assert(next,"unexpected ticket request");
      return next();
    },
  });
  vm.runInContext(code,context);
  return {...f,f,ctx:context,nodes,disk};
}
test("both start buttons require a successful ticket admission, no charge for retries, paused rounds or Sandbox",async()=>{
  const {ctx,f,nodes}=fixture();
  f.responses.push(()=>resp(snapshot(3)));
  await ctx.refreshAdventureTickets();
  assert.match(nodes.advTicketQty.textContent,/3 张/);
  let finish;
  f.responses.push(()=>new Promise(r=>{finish=r;}));
  const starting=ctx.requestAdventureRound("blaster");
  await ctx.requestAdventureRound("blaster");
  assert.equal(f.requests.length,2);
  assert.deepEqual(f.starts,[]);
  assert.equal(nodes.blasterStartBtn.disabled,true);
  finish(resp(snapshot(2))); await starting;
  assert.deepEqual(f.starts,["blaster"]);
  assert.equal(f.requests[1].game,"blaster");
  assert.match(nodes.advTicketQty.textContent,/2 张/);
  ctx.blasterState={pausedForPopover:true};
  await ctx.requestAdventureRound("blaster");
  assert.equal(f.requests.length,2);
  f.active="rain";
  f.responses.push(()=>resp({...snapshot(0),ok:false,error:"no_tickets"},409));
  await ctx.requestAdventureRound("rain");
  assert.deepEqual(f.starts,["blaster"]);
  assert.match(nodes.advTicketStatus.textContent,/没有可用/);
  ctx.debugState.active=true;
  await ctx.requestAdventureRound("rain");
  assert.deepEqual(f.starts,["blaster","rain"]);
  assert.equal(f.requests.length,3);
});

test("lost admission response reuses the ID; a close holds the paid entry for the next open",async()=>{
  const {ctx,f,disk}=fixture();
  f.responses.push(()=>{throw Error("connection interrupted");});
  await ctx.requestAdventureRound("blaster");
  let finish;
  f.responses.push(()=>new Promise(r=>{finish=r;}));
  const retry=ctx.requestAdventureRound("blaster");
  await Promise.resolve();
  assert.equal(f.requests[0].operation_id,f.requests[1].operation_id);
  f.visible=false;
  finish(resp({...snapshot(2),replayed:true}));
  await retry;
  assert.deepEqual(f.starts,[]);
  assert.equal(disk.get("tootoo_ticket_ready_blaster"),"1");
  f.visible=true; f.active="rain";
  await ctx.requestAdventureRound("rain");
  assert.equal(f.requests.length,2);
  f.active="blaster"; await ctx.requestAdventureRound("blaster");
  assert.deepEqual(f.starts,["blaster"]);
  assert.equal(f.requests.length,2);
  assert.equal(disk.has("tootoo_ticket_ready_blaster"),false);
});

test("buy retry uses one ID and once confirmed updates balance, inventory and cap",async()=>{
  const {ctx,f,nodes}=fixture();
  f.responses.push(()=>{throw Error("after commit");});
  await ctx.buyAdventureTicket();
  assert.equal(nodes.advTicketBuy.textContent,"确认上次购券");
  assert.equal(ctx.carrotDiskState.balance,15);
  f.responses.push(()=>resp({...snapshot(4,10,0),replayed:true}));
  await ctx.buyAdventureTicket();
  assert.deepEqual(f.requests[0], f.requests[1]);
  assert.equal(ctx.carrotDiskState.balance,10);
  assert.match(nodes.advTicketQty.textContent,/4 张/);
  assert.equal(nodes.advTicketBuy.disabled,true);
  assert.equal(f.starts.length,0);
});

test("only explicit start buttons request a ticket, not prop clicks or view recovery",()=>{
  assert.match(html,/"blasterStartBtn"\)\.addEventListener\("click", \(\) => void requestAdventureRound\("blaster"\)\)/);
  assert.match(html,/"rainStartBtn"\)\.addEventListener\("click", \(\) => void requestAdventureRound\("rain"\)\)/);
  const props = html.split("function useAdventureProp(")[1].split('["blPropBar", "rainPropBar"].forEach')[0];
  assert.doesNotMatch(props,/start(?:Blaster|Rain)Game\(|requestAdventureRound\(/);
});
