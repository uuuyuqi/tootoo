const assert = require('node:assert/strict');
const {test} = require('node:test');
const path = require('node:path');
const vm = require('node:vm');
const fs = require('node:fs');
const html = fs.readFileSync(path.join(__dirname,'../ui/index.html'),'utf8');
test('settings exposes provider status only, not duplicate quotas or source switches', () => {
  assert.match(html, /id="quotaSourceCodex"/);
  assert.match(html, /id="quotaSourceAgy"/);
  assert.doesNotMatch(html, /quotaControl(?:Row|Btn)|QuotaControl(?:Row|Btn)|set(?:Agy|Codex)QuotaControl|id="agyQuotaGroups"/);
});
test('CLI exact weekly groups remain separate, including 0%, and diagnostics are sanitized', () => {
  const code = html.slice(html.indexOf('function agyQuotaDiagnostic('),html.indexOf('const numAnimState'));
  for (const mode of ['none','cg7d','argon7d']) {
    const shown=new Set();
    const divs = Object.fromEntries(['topQuota','quotaSourceAgy','tqName','tqPct','tqFill','tqRst'].map(key=>[key,{
      style:{}, classList:{add:x=>shown.add(x),remove:x=>shown.delete(x)},removeAttribute(){},replaceChildren(...els){this.elements=els;}
    }]));
    const data = {quota_status:{antigravity:{selected_source:'cli',state:'cached'}},quotas:{antigravity:{source:'cli_cached',buckets:[
      {key:'antigravity:cg_7d',label:'Claude / GPT · Weekly',used_percent:100},
      {key:'antigravity:argon_7d',label:'Argon · Weekly',used_percent:58}
    ]}}};
    vm.runInNewContext(code+'\nrenderTopQuota(data);', {data,menuBarQuotaBar:mode,document:{getElementById:id=>divs[id],createElement:()=>({})}});
    assert.match(divs.quotaSourceAgy.textContent,/AGY CLI/);
    assert.equal(shown.has('show'),mode!=='none');
    if(mode!=='none') assert.equal(divs.tqPct.textContent,mode==='cg7d'?'剩 0%':'剩 42%');
    if(mode==='argon7d') assert.equal(divs.tqName.textContent,'Gemini 4 Argon 周额度');
    assert.equal(vm.runInNewContext(code+'\nagyQuotaDiagnostic({selected_source:"cli",state:"unavailable",reason:"cli_timeout",raw:"secret"});'), 'AGY 查询超时');
  }
});

test('only official AGY rows share grid columns; missing reset leaves no fake date', () => {
  const renderer = html.slice(html.indexOf('function renderAgents('), html.indexOf('let qcfgState = '));
  const rows = [{label:'Claude and GPT models · Weekly', used_percent:0},
    {label:'Gemini Models · 5h', used_percent:10, resets_at:123}];
  for (const [tool,source,aligned] of [
    ['antigravity','cli',true], ['antigravity','cli_cached',true], ['antigravity','provider',true],
    ['antigravity','local',false], ['codex','provider',false],
  ]) {
    const node = {querySelectorAll: () => []};
    vm.runInNewContext(renderer + '\nrenderAgents({kpi:{tokens:1},tools:[fixture]});', {
      fixture:{tool,label:tool,tokens:1,cost:0,quota:{source,buckets:rows}},
      document:{getElementById:()=>node},localStorage:{getItem:()=>null},
      esc:String,fmtCostRich:String,fmtNum:String,splitNumUnit:String,fmtResetTime:()=> '3h7m',
    });
    assert.equal(node.innerHTML.includes('quota-list agy-quota-grid'),aligned);
    assert.match(node.innerHTML,/Claude and GPT models · Weekly/);
    assert.match(node.innerHTML,/剩 100%/);
    assert.equal((node.innerHTML.match(/class="quota-rst"/g)||[]).length,1);
  }
});

test('full no-reset Claude/GPT 5h and weekly are individually selectable with no countdown', () => {
  const code = html.slice(html.indexOf('function agyQuotaDiagnostic('), html.indexOf('const numAnimState'));
  for (const [mode, label] of [['cg5h','Claude and GPT models · 5h'], ['cg7d','Claude and GPT models · Weekly']]) {
    const divs = Object.fromEntries(['topQuota','quotaSourceAgy','tqName','tqPct','tqFill','tqRst'].map(key=>[key,{
      style:{}, classList:{add(){},remove(){}},removeAttribute(){},replaceChildren(...els){this.elements=els;}
    }]));
    const data = {quota_status:{antigravity:{selected_source:'cli',state:'live'}},quotas:{antigravity:{source:'cli',buckets:[
      {id:'gemini_5h',label:'Gemini Models · 5h',used_percent:25,resets_at:123},
      {id:'cg_5h',label:'Claude and GPT models · 5h',used_percent:0,resets_at:null},
      {id:'cg_7d',label:'Claude and GPT models · Weekly',used_percent:0,resets_at:null},
      {id:'argon_7d',label:'Gemini 4 Argon · Weekly',used_percent:58,resets_at:null}
    ].map(b=>({...b,key:'antigravity:'+b.id}))}}};
    vm.runInNewContext(code+'\nrenderTopQuota(data);', {data,menuBarQuotaBar:mode,
      fmtResetTime:()=>{throw Error('reset shown for unstarted window');},
      document:{getElementById:id=>divs[id],createElement:()=>({})}});
    assert.equal(divs.tqName.textContent,label);
    assert.equal(divs.tqPct.textContent,'剩 100%');
    assert.equal(divs.tqRst.textContent,'');
  }
});

function coldQuotaHarness(mode = 'gem7d', isPopover = false) {
  const code = html.slice(html.indexOf('function pickCodexQuotaBucket('), html.indexOf('const numAnimState ='));
  const fetchCode = html.slice(html.indexOf('let activeFetchCtrl = null;'), html.indexOf('let shouldAnimateCharts = true;'));
  const clock = new Map(), requests = [], streams = [];
  let timerId = 0, activeStream;
  const divs = Object.fromEntries(['topQuota','quotaSourceAgy','tqName','tqPct','tqFill','tqRst'].map(key => [key, {
    style: {}, classList: { add(){}, remove(){} }, removeAttribute(){}, replaceChildren(){},
  }]));
  const shown = new Set();
  divs.topQuota.classList = { add: cls => shown.add(cls), remove: cls => shown.delete(cls) };
  const ctx = vm.createContext({
    menuBarQuotaBar: mode, fetchSeq: 0, lastFetchTs: 0, isPopover, bootRetryTimer: null,
    requestAnimationFrame(){}, resumePopoverArcade(){},
    state: { range: 'today', tool: 'all', data: {} },
    document: { hidden: false, body: { classList: { add(){}, remove(){} } }, getElementById: id => divs[id], addEventListener(){} },
    window: {}, console, AbortController, finishBoot(){}, postNative(){},
    setTimeout(fn, ms) { const id = ++timerId; clock.set(id, {fn, ms}); return id; },
    clearTimeout(id) { clock.delete(id); },
    fetch(url) { return new Promise(resolve => requests.push({url, respond: d => resolve({ok:true, json: async () => d})})); },
    EventSource: class { constructor(url) { activeStream = this; streams.push(this); this.url = url; } close(){ this.closed = true; } },
  });
  vm.runInContext(code + '\n' + fetchCode + '\nfunction renderAll(d) { renderTopQuota(d); }', ctx);
  const emit = d => activeStream.onmessage({data: JSON.stringify(d)});
  ctx.connectStream();
  const loading = { quota_status: { antigravity: { state: 'loading', selected_source: 'cli' } } };
  function cached() {
    return {
      quota_status: { antigravity: { state: 'cached', selected_source: 'cli', refreshing: false, reason: 'cli_timeout' } },
      quotas: { antigravity: { source: 'cli_cached', buckets: [
        { key: 'antigravity:gemini_7d', label: 'Gemini Models · Weekly', used_percent: 16 },
      ] } },
    };
  }
  function tickRetry() {
    const [id, tick] = [...clock].find(([, t]) => t.ms === 2000) || [];
    assert.ok(tick, 'one short retry scheduled');
    clock.delete(id);
    tick.fn();
  }
  return { ctx, divs, requests, streams, shown, clock, emit, loading, cached, tickRetry, scheduled: () => [...clock.values()].filter(t => t.ms === 2000).length };
}

test('cold eligible pin is reading; last successful value survives refresh and a late fallback GET', async () => {
  const h = coldQuotaHarness();
  h.emit(h.loading);
  h.emit(h.loading);
  assert.equal(h.divs.tqPct.textContent, '读取中…');
  assert.match(h.divs.topQuota.title, /正在读取/);
  assert.equal(h.scheduled(), 1);
  h.tickRetry();
  assert.equal(h.requests.length, 1);
  assert.match(h.requests[0].url, /force=0/);
  h.emit(h.cached());
  assert.equal(h.divs.tqPct.textContent, '剩 84%');
  assert.match(h.divs.quotaSourceAgy.textContent, /上次额度.*超时/);
  assert.equal(h.scheduled(), 0);
  h.requests[0].respond(h.loading);
  await new Promise(setImmediate);
  assert.equal(h.divs.tqPct.textContent, '剩 84%', 'old fallback must not erase SSE quota');
  const refreshing = h.cached();
  refreshing.quota_status.antigravity.refreshing = true;
  h.emit(refreshing);
  assert.equal(h.divs.tqPct.textContent, '剩 84%');
  assert.equal(h.scheduled(), 0);
});

test('cold retry capped at three and never borrowed for Codex or another AGY group', async () => {
  const h = coldQuotaHarness();
  h.emit(h.loading);
  for (let i = 0; i < 3; i++) {
    h.tickRetry();
    h.requests[i].respond(h.loading);
    await new Promise(setImmediate);
  }
  assert.equal(h.requests.length, 3);
  assert.equal(h.scheduled(), 0);
  h.emit(h.loading);
  assert.equal(h.scheduled(), 0, 'repeated loading SSE does not reset budget');
  h.emit({ quota_status: { antigravity: { state: 'unavailable', selected_source: 'cli', reason: 'cli_timeout' } } });
  assert.equal(h.divs.tqPct.textContent, '暂无数据');
  for (const mode of ['codex', 'none', 'cg7d']) {
    h.ctx.menuBarQuotaBar = mode;
    h.emit(mode === 'cg7d' ? h.cached() : h.loading);
    assert.equal(h.scheduled(), 0);
    assert.equal(h.divs.tqPct.textContent, '暂无数据');
  }
});

test('explicit Codex loading is visible in Codex and auto mode, but never displaces a valid official quota', () => {
  const h = coldQuotaHarness('codex');
  const codexLoading = { quota_status: { codex: { state: 'loading' } } };
  h.emit(codexLoading);
  assert.equal(h.divs.tqName.textContent, 'Codex 周');
  assert.equal(h.divs.tqPct.textContent, '读取中…');
  assert.equal(h.shown.has('show'), true);
  assert.equal(h.scheduled(), 0, 'Codex uses SSE rather than a new polling loop');
  h.ctx.menuBarQuotaBar = 'auto';
  h.emit(codexLoading);
  assert.equal(h.divs.tqName.textContent, '官方额度');
  assert.equal(h.divs.tqPct.textContent, '读取中…');
  h.emit({ ...h.cached(), ...codexLoading });
  assert.equal(h.divs.tqPct.textContent, '剩 84%');
  h.ctx.menuBarQuotaBar = 'codex';
  h.emit({ ...codexLoading, quotas: { codex: { secondary: { used_percent: 0, window_minutes: 10080 } } } });
  assert.equal(h.divs.tqPct.textContent, '剩 100%');
  h.emit({ quota_status: { codex: { state: 'unavailable' } } });
  assert.equal(h.divs.tqPct.textContent, '暂无数据');
  h.ctx.menuBarQuotaBar = 'auto';
  h.emit({ quota_status: { codex: { state: 'no_data' } } });
  assert.equal(h.shown.has('show'), false);
  h.emit(h.loading);
  assert.equal(h.divs.tqPct.textContent, '读取中…');
});

test('both tool cards show only explicit cold loading and retain valid buckets', () => {
  const renderer = html.slice(html.indexOf('function renderAgents('), html.indexOf('let qcfgState = '));
  for (const tool of ['codex','antigravity']) {
    const node = {querySelectorAll: () => []};
    const fixture = {tool, label:tool, tokens:1};
    const status = {state:'loading'};
    const data = {kpi:{tokens:1}, tools:[fixture], quota_status:{[tool]:status}};
    const ctx = vm.createContext({
      data, document:{getElementById:()=>node}, localStorage:{getItem:()=>null},
      esc:String, fmtCostRich:String, fmtNum:String, splitNumUnit:String,
    });
    vm.runInContext(renderer, ctx);
    ctx.renderAgents(data);
    assert.match(node.innerHTML,/额度<\/span><span[^>]+>读取中…/);
    fixture.quota = { buckets:[{used_percent:null}, {used_percent:100}] };
    ctx.renderAgents(data);
    assert.match(node.innerHTML,/剩 0%/);
    assert.doesNotMatch(node.innerHTML,/读取中…|剩 100%/);
    fixture.quota = { buckets:[{used_percent:null}] };
    status.state = 'unavailable';
    ctx.renderAgents(data);
    assert.doesNotMatch(node.innerHTML,/读取中…|剩 100%/);
  }
});

test('reconnect uses displayed quota cursor, old streams are ignored, and native manual refresh is forced', async () => {
  const h = coldQuotaHarness();
  assert.doesNotMatch(h.streams[0].url, /since_quota_version/);
  h.emit({ ...h.loading, quota_version: 120 });
  h.ctx.connectStream(true);
  assert.match(h.streams[1].url, /skip_initial=1&since_quota_version=120/);
  assert.equal(h.streams[0].closed, true);
  const pending = h.ctx.window.__refreshTelemetry();
  assert.match(h.requests[0].url,/force=1/);
  h.emit({ ...h.cached(), quota_version: 121 });
  h.streams[0].onmessage({ data: JSON.stringify(h.loading) });
  assert.equal(h.divs.tqPct.textContent, '剩 84%');
  h.requests[0].respond({ ...h.loading, quota_version: 120 });
  await pending;
  assert.equal(h.divs.tqPct.textContent, '剩 84%');
  h.ctx.document.hidden = true;
  h.ctx.connectStream(true);
  assert.equal(h.streams[1].closed, true);
  assert.equal(h.streams.length, 2, 'hidden page must not start another stream');
});

test('native hidden prewarm does not poll after failure and opening retries unfinished boot', async () => {
  const h = coldQuotaHarness('codex', true);
  h.ctx.state.data = null;
  const boot = h.ctx.fetchTelemetry(false);
  h.requests[0].respond(null);
  await boot;
  assert.equal(h.streams.length, 0);
  assert.equal(h.clock.size, 0);
  h.ctx.window.__onPopoverVisibility({ generation: 1, visible: true });
  assert.equal(h.requests.length, 2);
  const fresh = { quota_version: 320, kpi: { requests: 1 }, quota_status: { codex: { state: 'loading' } } };
  h.requests[1].respond(fresh);
  await new Promise(setImmediate);
  assert.equal(h.divs.tqPct.textContent, '读取中…');
  assert.match(h.streams[0].url, /since_quota_version=320/);
});
