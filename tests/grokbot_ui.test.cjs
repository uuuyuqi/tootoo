const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'../ui/index.html'),'utf8');
const slice=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b));
const top=slice('function pickCodexQuotaBucket(', 'const numAnimState');
const renderer=slice('function renderGrokBotAgent(', 'let qcfgState = ');
const chips=slice('let menuBarFields = ', 'const state = {');
const now=Date.now()/1000;
function quota(age=2000,p=100,reset=now+2000) {
  return {source:'local_cache',cached:true,read_at:now-500,expires_at:now+age,
    would_refuse_send:true,plan:'Grok Bot Plan',plan_tier:'Premium',buckets:[{key:'grokbot:weekly',used_percent:p,resets_at:reset}]};
}
function fixture() {
  const nodes=Object.fromEntries(['tqName','tqPct','tqFill','tqRst','topQuota','agentList','agentCountPill']
    .map(key=>[key,{style:{},classList:{add(){},remove(){},toggle(){}},removeAttribute(){},querySelectorAll:()=>[]}]));
  const mkBtn=(dataset)=>({dataset,classList:{toggle(){}},hidden:true});
  const field=mkBtn({field:'q_grokbot'}), pin=mkBtn({qbar:'grokbot'});
  const doc={getElementById:id=>nodes[id],querySelectorAll:s=>s.includes('QuotaBar')?[pin]:[field]};
  const w={};
  const ctx=vm.createContext({state:{data:null}, window:w, document:doc, localStorage:{getItem:()=>null},
    fmtNum:String, esc:String, fmtResetTime:()=> '2h'});
  vm.runInContext(top+renderer+chips,ctx);
  return {ctx,nodes,field,pin,window:w};
}
test('Grok Bot config, explicit and automatic pin use valid official local quota only', () => {
  const f=fixture();
  f.ctx.renderMenuBarCfgChips();
  assert.equal(f.field.hidden,true);
  assert.equal(f.pin.hidden,true);
  const data={quotas:{grokbot:quota()}};
  f.ctx.state.data=data;
  f.ctx.renderTopQuota(data);
  assert.equal(f.field.hidden,false); assert.equal(f.pin.hidden,false);
  assert.equal(f.nodes.tqName.textContent,'Grok Bot 周');
  assert.equal(f.nodes.tqPct.textContent,'剩 0%');
  data.quotas.codex={secondary:{used_percent:40,window_minutes:10080}};
  f.ctx.renderTopQuota(data);
  assert.equal(f.nodes.tqName.textContent,'Codex 周');
  f.window.__onMenuBarFields(['tokens','q_grokbot'],'grokbot');
  assert.equal(f.nodes.tqName.textContent,'Grok Bot 周');
  data.quotas.grokbot=quota(-1);
  f.ctx.renderTopQuota(data);
  assert.equal(f.nodes.tqPct.textContent,'待刷新');
  assert.equal(f.field.hidden,false); assert.equal(f.pin.hidden,false);
  f.window.__onMenuBarFields(['tokens'],'auto');
  assert.equal(f.field.hidden,true); assert.equal(f.pin.hidden,true);
  assert.equal(f.nodes.tqName.textContent,'Codex 周');
});
test('Grok Bot activity stays distinct from token and cost telemetry, including quota-only and expired', () => {
  const f=fixture();
  const data={kpi:{tokens:0},tools:[],grokbot:{sessions:2,total_sessions:7,user_messages:5,bot_replies:4,reply_latency_p50:3.12,latency_samples:2,last_active_ts:now-60},quotas:{grokbot:quota()}};
  f.ctx.renderAgents(data);
  const card=()=>f.nodes.agentList.innerHTML;
  assert.match(card(),/Grok Bot[\s\S]*会话<\/span><strong[^>]*>2 个[\s\S]*交互<\/span><strong[^>]*>5 问 \/ 4 答[\s\S]*回复中位<\/span><strong[^>]*>3.12s/);
  assert.match(card(),/剩 0.0%[\s\S]*本地缓存 · 读取 [^<]*2h 后重置 · 已用 100.0%[\s\S]*拒绝发送/);
  assert.match(card(),/Grok Bot Plan · Premium/);
  assert.match(card(),/不计入总 Token \/ 费用 \/ 模型排行/);
  assert.doesNotMatch(card(),/stat-lbl">(?:费用|Token|模型)|暂无本地会话数据/);
  data.grokbot=null;
  f.ctx.renderAgents(data);
  assert.match(card(),/剩 0.0%/); assert.match(card(),/回复中位<\/span><strong[^>]*>—/);
  for (const [invalid,label] of [
    [quota(-1),/缓存已过期/],[quota(2000,0,now-10),/缓存已过期/],[quota(0),/缓存已过期/],
    [{...quota(),state:"expired",buckets:[]},/缓存已过期/],[quota(100,'0'),/暂无可用周额度/],
  ]) {
    data.quotas.grokbot=invalid;
    f.ctx.renderAgents(data);
    assert.match(card(),label); assert.doesNotMatch(card(),/剩 \d+%|本地缓存|拒绝发送/);
  }
});
