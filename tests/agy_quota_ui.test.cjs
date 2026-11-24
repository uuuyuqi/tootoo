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
    assert.equal(vm.runInNewContext(code+'\nagyQuotaDiagnostic({selected_source:"cli",state:"unavailable",reason:"cli_timeout",raw:"secret"});'), 'AGY 查询超时');
  }
});

test('only official AGY rows share grid columns; missing reset leaves no fake date', () => {
  const renderer = html.slice(html.indexOf('function renderAgents('), html.indexOf('let qcfgState = '));
  const rows = [{label:'Claude and GPT models · Weekly', used_percent:0},
    {label:'Gemini Models · 5h', used_percent:10, resets_at:123}];
  for (const [tool,source,aligned] of [
    ['antigravity','cli',true], ['antigravity','provider',true],
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
