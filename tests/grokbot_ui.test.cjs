const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'../ui/index.html'),'utf8');
const slice=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b));
const top=slice('function pickCodexQuotaBucket(', 'const numAnimState');
const tools=slice('let pendingGrokFocus = false;', 'function pickCodexQuotaBucket(');
const renderer=slice('function renderGrokBotAgent(', 'let qcfgState = ');
const chips=slice('let menuBarFields = ', 'const state = {');
const now=Date.now()/1000;
function quota(age=2000,p=100,reset=now+2000) {
  return {source:'local_cache',cached:true,read_at:now-500,expires_at:now+age,
    would_refuse_send:true,plan:'Grok Bot Plan',plan_tier:'Premium',buckets:[{key:'grokbot:weekly',used_percent:p,resets_at:reset}]};
}
function fixture(isPopover=false, reduceMotion=false) {
  const nodes=Object.fromEntries(['tqName','tqPct','tqFill','tqRst','topQuota','agentList','agentCountPill','agentListPop','agentCountPillPop','toolBar']
    .map(key=>[key,{style:{},classList:{add(){},remove(){},toggle(){}},removeAttribute(){},querySelectorAll:()=>[]}]));
  const mkBtn=(dataset)=>({dataset,classList:{toggle(){}},hidden:true});
  const field=mkBtn({field:'q_grokbot'}), pin=mkBtn({qbar:'grokbot'});
  const actions=[];
  let chipClick;
  nodes.toolBar.querySelector=()=>({addEventListener:(event, fn)=>{if(event==='click') chipClick=fn;}});
  const doc={getElementById:id=>nodes[id],querySelectorAll:s=>s.includes('QuotaBar')?[pin]:[field],
    querySelector:selector=>selector.startsWith('#popTabs')
      ? {click:()=>actions.push(['tab',selector])}
      : {focus:options=>actions.push(['focus',selector,options.preventScroll]),
         scrollIntoView:options=>actions.push(['scroll',selector,options.block,options.behavior])}};
  const w={matchMedia:()=>({matches:reduceMotion})};
  const ctx=vm.createContext({state:{data:null,tool:'all'}, window:w, document:doc, localStorage:{getItem:()=>null}, isPopover,
    lastSeenCallTs:0, fetchTelemetry:()=>actions.push(['fetch']), connectStream:()=>actions.push(['stream']),
    fmtNum:String, esc:String, fmtCostRich:String, splitNumUnit:String, fmtResetTime:()=> '2h'});
  vm.runInContext(top+renderer+chips+tools,ctx);
  return {ctx,nodes,field,pin,window:w,actions,clickGrok:()=>chipClick()};
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


test('Grok Bot appends after token-sorted tools in both views, and its chip still focuses and scrolls', () => {
  const tools = [
    {tool:'codex', short:'Codex', label:'Codex', tokens:9000, requests:5, accent:'#36c'},
    {tool:'gemini', short:'Gemini', label:'Gemini', tokens:1000, requests:2, accent:'#63c'},
  ];
  const data={kpi:{tokens:10000}, tools, available_tools:tools, grokbot:{sessions:1}, quotas:{grokbot:quota()}};
  for (const isPopover of [false,true]) {
    const f=fixture(isPopover);
    f.ctx.renderAgents(data);
    for (const id of ['agentList','agentListPop']) {
      const cards=f.nodes[id].innerHTML;
      assert.match(cards,/agent-name">Codex[\s\S]*agent-name">Gemini[\s\S]*data-agent="grokbot"/);
    }
    f.ctx.renderToolChips(data);
    assert.match(f.nodes.toolBar.innerHTML,/data-focus-agent="grokbot"/);
    f.clickGrok();
    const selector=(isPopover?'#agentListPop':'#agentList')+' [data-agent="grokbot"]';
    assert.deepEqual(f.actions,[
      ...(isPopover?[['tab','#popTabs [data-tab="overview"]']]:[]),
      ['focus',selector,true],['scroll',selector,'nearest','smooth'],
    ]);
    assert.equal(f.ctx.state.tool,'all');
  }
  const reduced=fixture(false,true);
  reduced.ctx.renderToolChips(data);
  reduced.clickGrok();
  assert.deepEqual(reduced.actions.at(-1),['scroll','#agentList [data-agent="grokbot"]','nearest','auto']);
});

test('individual filters exclude Grok Bot; its own chip returns to all and focuses the rendered card', () => {
  const f = fixture(true);
  const tools = ['antigravity', 'codex', 'gemini', 'omp', 'droid'].map(tool => ({tool, short:tool, label:tool, tokens:100, requests:1}));
  tools.find(t => t.tool === 'droid').credits = 120;
  const base = {kpi:{tokens:100},available_tools:tools,grokbot:{sessions:1},quotas:{grokbot:quota()}};
  for (const tool of tools) {
    f.ctx.state.tool = tool.tool;
    // An older All snapshot cannot bring the card back after a click.
    f.ctx.renderAgents({...base, tool_filter:'all', tools:[tool]});
    assert.doesNotMatch(f.nodes.agentListPop.innerHTML,/data-agent="grokbot"/);
    f.ctx.renderAgents({...base, tool_filter:tool.tool, tools:[tool]});
    for (const suffix of ['', 'Pop']) {
      assert.doesNotMatch(f.nodes['agentList'+suffix].innerHTML,/data-agent="grokbot"/);
      assert.equal(f.nodes['agentCountPill'+suffix].textContent, '1 个活跃');
      if (tool.tool === 'droid') assert.match(f.nodes['agentList'+suffix].innerHTML, /Factory 积分 · 已耗 120/);
    }
  }
  f.ctx.renderToolChips(base);
  assert.match(f.nodes.toolBar.innerHTML,/data-focus-agent="grokbot"/);
  f.clickGrok();
  assert.equal(f.ctx.state.tool, 'all');
  assert.deepEqual(f.actions.map(a=>a[0]), ['tab','fetch','stream']);
  f.ctx.renderAgents({...base, tool_filter:'all', tools});
  assert.deepEqual(f.actions.at(-1), ['scroll','#agentListPop [data-agent="grokbot"]','nearest','smooth']);
  assert.match(f.nodes.agentListPop.innerHTML,/Factory 积分 · 已耗 120[\s\S]*data-agent="grokbot"/);
});
