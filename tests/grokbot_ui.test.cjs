const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'../ui/index.html'),'utf8');
const slice=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b));
const top=slice('function pickCodexQuotaBucket(', 'const numAnimState');
const tools=slice('function renderToolChips(', 'function pickCodexQuotaBucket(');
const renderer=slice('function renderGrokBotAgent(', 'let qcfgState = ');
const chips=slice('let menuBarFields = ', 'const state = {');
const now=Date.now()/1000;
function quota(age=2000,p=100,reset=now+2000) {
  return {source:'local_cache',cached:true,read_at:now-500,expires_at:now+age,
    would_refuse_send:true,plan:'Grok Bot Plan',plan_tier:'Premium',buckets:[{key:'grokbot:weekly',used_percent:p,resets_at:reset}]};
}
function fixture(isPopover=false) {
  const nodes=Object.fromEntries(['tqName','tqPct','tqFill','tqRst','topQuota','agentList','agentCountPill','agentListPop','agentCountPillPop','toolBar']
    .map(key=>[key,{style:{},classList:{add(){},remove(){},toggle(){}},removeAttribute(){},querySelectorAll:()=>[]}]));
  const mkBtn=(dataset)=>({dataset,classList:{toggle(){}},hidden:true});
  const field=mkBtn({field:'q_grokbot'}), pin=mkBtn({qbar:'grokbot'});
  const actions=[];
  const handlers=new Map(), classes=new Set();
  nodes.toolBar.querySelectorAll=()=>Array.from(nodes.toolBar.innerHTML.matchAll(/data-tool="([^"]+)"/g), ([,tool])=>({
    dataset:{tool}, classList:{add(){},remove(){}},
    addEventListener(event,fn){if(event==='click') handlers.set(tool,fn);},
  }));
  const doc={body:{classList:{toggle(name,on){if(on) classes.add(name); else classes.delete(name);}}},
    getElementById:id=>nodes[id],querySelectorAll:s=>s.includes('QuotaBar')?[pin]:[field]};
  const w={};
  const state={data:null,tool:'all'};
  const ctx=vm.createContext({state, window:w, document:doc, localStorage:{getItem:()=>null}, isPopover,
    lastSeenCallTs:0, shouldAnimateCharts:false, fetchTelemetry:()=>actions.push(['fetch',state.tool]),
    connectStream:()=>actions.push(['stream',state.tool]),
    fmtNum:String, esc:String, fmtCostRich:String, splitNumUnit:String, fmtResetTime:()=> '2h'});
  vm.runInContext(top+renderer+chips+tools,ctx);
  return {ctx,nodes,field,pin,window:w,actions,classes,click:tool=>handlers.get(tool)()};
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


test('tool chips filter consistently in both layouts; Grok Bot is last in All', () => {
  const tools = ['antigravity', 'codex', 'gemini', 'omp', 'pi', 'droid'].map((tool,i) =>
    ({tool, short:tool.toUpperCase(), label:tool === 'omp' ? 'Oh My Pi' : tool === 'pi' ? 'Pi' : tool,
      tokens:(6-i)*100, requests:1}));
  tools.find(t => t.tool === 'droid').credits = 120;
  const base = {kpi:{tokens:2100},available_tools:tools,grokbot:{sessions:1},quotas:{grokbot:quota()}};
  for (const isPopover of [false,true]) {
    const f=fixture(isPopover);
    const lists=()=>[f.nodes.agentList.innerHTML,f.nodes.agentListPop.innerHTML];
    const counts=()=>[f.nodes.agentCountPill.textContent,f.nodes.agentCountPillPop.textContent];
    f.ctx.renderToolChips(base);
    f.ctx.renderAgents({...base, tools});
    for (const html of lists()) assert.match(html,/agent-name">antigravity[\s\S]*agent-name">droid[\s\S]*data-agent="grokbot"/);
    for (const t of tools) {
      f.click(t.tool);
      assert.deepEqual(f.actions.slice(-2),[['fetch',t.tool],['stream',t.tool]]);
      f.ctx.renderToolChips(base);
      assert.ok(f.nodes.toolBar.innerHTML.includes(`chip active" data-tool="${t.tool}"`));
      f.ctx.renderAgents({...base, tools:[t]});
      for (const html of lists()) {
        assert.doesNotMatch(html,/data-agent="grokbot"/);
        if (t.tool === 'pi' || t.tool === 'omp') {
          const other = tools.find(row => row.tool === (t.tool === 'pi' ? 'omp' : 'pi'));
          assert.ok(html.includes(`agent-name">${t.label}</`));
          assert.ok(!html.includes(`agent-name">${other.label}</`));
        }
      }
      assert.deepEqual(counts(),['1 个活跃','1 个活跃']);
    }
    f.click('grokbot');
    assert.deepEqual(f.actions.slice(-2),[['fetch','grokbot'],['stream','grokbot']]);
    f.ctx.renderToolChips(base);
    assert.match(f.nodes.toolBar.innerHTML,/chip active" data-tool="grokbot"/);
    assert.equal(f.classes.has('grokbot-view'), true);
    f.ctx.renderAgents({...base, tools:[]});
    for (const html of lists()) {
      assert.match(html,/data-agent="grokbot"/);
      assert.equal((html.match(/class="agent-item"/g)||[]).length,1);
    }
    assert.deepEqual(counts(),['1 个活跃','1 个活跃']);
    f.ctx.renderAgents({...base, tools:[], grokbot:null});
    assert.deepEqual(counts(),['0 个活跃','0 个活跃']);
    for (const html of lists()) assert.match(html,/data-agent="grokbot"/);
    f.click('all');
    f.ctx.renderToolChips(base);
    f.ctx.renderAgents({...base, tools});
    assert.equal(f.classes.has('grokbot-view'), false);
    assert.deepEqual(counts(),['7 个活跃','7 个活跃']);
  }
});
