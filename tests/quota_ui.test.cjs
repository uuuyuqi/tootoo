const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {test} = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../ui/index.html'), 'utf8');
const helpers = html.slice(html.indexOf('function pickCodexQuotaBucket('), html.indexOf('const numAnimState = {}'));
const cards = html.slice(html.indexOf('function renderAgents('), html.indexOf('let qcfgState = '));

function render(mode, quotas, quota_status) {
  const shown = new Set();
  const els = Object.fromEntries(['topQuota', 'tqName', 'tqPct', 'tqFill', 'tqRst', 'quotaSourceCodex', 'quotaSourceAgy'].map(
    id => [id, {style: {}, classList: {add: c => shown.add(c), remove: c => shown.delete(c)}}],
  ));
  vm.runInNewContext(helpers + '\nrenderTopQuota({ quotas, quota_status });', {
    quotas, quota_status, menuBarQuotaBar: mode,
    document: {getElementById: id => els[id]},
    fmtResetTime: value => String(value),
  });
  return {
    bar: [shown.has('show'), els.tqName.textContent, els.tqPct.textContent],
    codex: els.quotaSourceCodex.textContent, agy: els.quotaSourceAgy.textContent,
  };
}

const weekly = used_percent => ({used_percent, window_minutes: 10080});
const short = used_percent => ({used_percent, window_minutes: 300});
const agy = (key, used_percent) => ({key: 'antigravity:' + key, used_percent});
const cx = (primary, secondary = null) => ({source:'app_server', freshness:'live', account_scope:'current_cli', primary, secondary});
const ag = buckets => ({source:'provider', buckets});

test('weekly Codex in either slot takes precedence, with a valid zero', () => {
  assert.deepEqual(render('codex', {codex: cx(short(60), weekly(0))}).bar, [true, 'Codex 周', '剩 100%']);
  assert.deepEqual(render('codex', {codex: cx(weekly(90), short(20))}).bar, [true, 'Codex 周', '剩 10%']);
  assert.deepEqual(render('codex', {codex: cx(null, short(10))}).bar, [true, 'Codex', '剩 90%']);
});

test('selected quota is respected, otherwise falls back only to a verified current source', () => {
  const codex = cx(weekly(60));
  const buckets = [agy('cg_5h', 20), agy('gemini_7d', 40), agy('gemini_5h', 80)];
  assert.deepEqual(render('cg5h', {codex, antigravity: ag(buckets)}).bar, [true, 'C/G 5h', '剩 80%']);
  assert.deepEqual(render('gem7d', {codex, antigravity: ag([buckets[2], buckets[0]])}).bar, [true, 'Gemini 5h', '剩 20%']);
  assert.deepEqual(render('gem5h', {codex, antigravity: ag(buckets.slice(0, 2))}).bar, [true, 'Gemini 周', '剩 60%']);
  assert.deepEqual(render('gem5h', {codex, antigravity: ag([buckets[0]])}).bar, [true, 'C/G 5h', '剩 80%']);
  assert.deepEqual(render('gem5h', {codex}).bar, [true, 'Codex 周', '剩 40%']);
  assert.equal(render('none', {codex, antigravity: ag(buckets)}).bar[0], false);
  for (const malformed of [null, "", false, -1, 101, Infinity, NaN]) {
    assert.equal(render('gem5h', {codex: cx(weekly(malformed)), antigravity: ag([agy('gemini_5h', malformed)])}).bar[0], false);
  }
});

test('expired/cached or unbound historical quota never becomes a headline percentage', () => {
  const codex = {source:'session_log', freshness:'unknown', account_scope:'unknown', primary:weekly(0)};
  const antigravity = {source:'provider_cached', buckets:[agy('gemini_5h',0)]};
  const data = render('codex',{codex, antigravity},{
    codex:{state:'unavailable'},antigravity:{state:'cached',reason:'discovery',cache_state:'partial'},
  });
  assert.equal(data.bar[0],false);
  assert.match(data.codex,/暂时无法.*历史日志.*账号未核实/);
  assert.match(data.agy,/未找到.*部分上次记录/);
  assert.equal(render('codex', {codex:{...cx(weekly(0)), account_scope:'unknown'}}).bar[0],false);
  assert.match(render('none',{},{
    codex:{state:'disabled'},antigravity:{state:'unavailable',reason:'http_status',cache_state:'expired'},
  }).agy,/本地请求未成功；上次记录已过期/);
});

test('historical detail cards explicitly say record-time remaining and omit reset countdown', () => {
  const node = {querySelectorAll: () => []};
  vm.runInNewContext(helpers + cards + '\nrenderAgents({kpi:{tokens:1},tools:[fixture]});', {
    fixture:{tool:'codex',label:'Codex',tokens:1,cost:0,quota:{
      source:'session_log',primary:{...weekly(50),resets_at:99999999},
    }},
    document:{getElementById: () => node}, localStorage:{getItem: () => '1'},
    esc:String, fmtCostRich:String, fmtNum:String, splitNumUnit:String,
    fmtResetTime: () => {throw Error('historical record presented as countdown');},
  });
  assert.match(node.innerHTML,/日志记录 · 账号未核实/);
  assert.match(node.innerHTML,/当时剩 50%/);
});

test('the same running AGY process can show a fresh sample without showing offline cache', () => {
  const antigravity = {source:'provider_cached', buckets:[agy('gemini_5h',20)]};
  const cached = {state:'cached',reason:null,cache_state:'fresh'};
  assert.deepEqual(render('gem5h',{antigravity},{antigravity:cached}).bar,
                   [true,'Gemini 5h · 最近','剩 80%']);
  assert.match(render('gem5h',{antigravity},{antigravity:cached}).agy,/运行中 · 最近读取/);
  assert.equal(render('gem5h',{antigravity},{antigravity:{...cached,reason:'discovery'}}).bar[0],false);
});

test('AGY diagnostics show only a valid numeric HTTP status for the matching error', () => {
  const diag=(reason,http_status)=>render('none',{},{
    antigravity:{state:'unavailable',reason,cache_state:'none',http_status},
  }).agy;
  assert.match(diag('http_status',401),/HTTP 401/);
  for(const invalid of ['401',0,600,1.5,null]) assert.doesNotMatch(diag('http_status',invalid),/HTTP/);
  assert.doesNotMatch(diag('connect_tls',401),/HTTP/);
});
