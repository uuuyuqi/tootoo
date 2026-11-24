const assert = require('node:assert/strict');
const {test} = require('node:test');
const path = require('node:path');
const vm = require('node:vm');
const fs = require('node:fs');
const html = fs.readFileSync(path.join(__dirname,'../ui/index.html'),'utf8');
const ui = html.split('// TOOTOO_AGY_CONTROL_START')[1].split('// TOOTOO_AGY_CONTROL_END')[0];
test('native AGY control requires real click and is absent in ordinary browsers', () => {
  for (const native of [false,true]) {
    const events=[], row={style:{display:'none'}}, button={disabled:false, addEventListener(e, fn){ this[e]=fn; }};
    const window=native ? {webkit:{messageHandlers:{tootoo:{}}}} : {};
    vm.runInNewContext(ui,{window,document:{getElementById: id=>id.endsWith('Row')?row:button},
      postNative:(action,payload)=>events.push([action,payload]),fetchTelemetry:force=>events.push(['refresh',force])});
    if (!native) {
      assert.equal(row.style.display,'none');
      assert.equal(button.click,undefined);
      assert.deepEqual(events,[]);
      continue;
    }
    assert.equal(events[0][0],'getAgyQuotaControl');
    window.__onAgyQuotaControl({enabled:true,busy:false});
    assert.match(button.textContent,/关闭 AGY/);
    button.click({isTrusted:false});
    assert.equal(events.length,1);
    button.click({isTrusted:true});
    assert.equal(events[1][0],'setAgyQuotaControl');
    assert.equal(events[1][1].enabled,false);
    window.__onAgyQuotaControl({enabled:false,busy:false,refresh:true});
    assert.deepEqual(events[2],['refresh',true]);
  }
});
test('CLI exact weekly groups remain separate, including 0%, and diagnostics are sanitized', () => {
  const code = html.slice(html.indexOf('function agyQuotaDiagnostic('),html.indexOf('const numAnimState'));
  for (const mode of ['none','cg7d','argon7d']) {
    const shown=new Set();
    const divs = Object.fromEntries(['topQuota','agyQuotaGroups','quotaSourceAgy','tqName','tqPct','tqFill','tqRst'].map(key=>[key,{
      style:{}, classList:{add:x=>shown.add(x),remove:x=>shown.delete(x)},removeAttribute(){},replaceChildren(...els){this.elements=els;}
    }]));
    const data = {quota_status:{antigravity:{selected_source:'cli',state:'cached'}},quotas:{antigravity:{source:'cli_cached',buckets:[
      {key:'antigravity:cg_7d',label:'Claude / GPT · Weekly',used_percent:100},
      {key:'antigravity:argon_7d',label:'Argon · Weekly',used_percent:58}
    ]}}};
    vm.runInNewContext(code+'\nrenderTopQuota(data);', {data,menuBarQuotaBar:mode,document:{getElementById:id=>divs[id],createElement:()=>({})}});
    assert.equal(divs.agyQuotaGroups.elements.length,2);
    assert.match(divs.agyQuotaGroups.elements[0].textContent,/0%$/);
    assert.match(divs.agyQuotaGroups.elements[1].textContent,/42%$/);
    assert.equal(shown.has('show'),mode!=='none');
    if(mode!=='none') assert.equal(divs.tqPct.textContent,mode==='cg7d'?'剩 0%':'剩 42%');
    assert.equal(vm.runInNewContext(code+'\nagyQuotaDiagnostic({selected_source:"cli",state:"unavailable",reason:"cli_timeout",raw:"secret"});'), 'AGY 查询超时');
  }
});
