const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname,'../ui/index.html'),'utf8');
const text=html.split('// TOOTOO_AGY_CONTROL_START')[1].split('// TOOTOO_AGY_CONTROL_END')[0];
if (!html.includes('/*__TOOTOO_DEBUG_FLAG__*/true')) {
  test('Release removes AGY native controls', () => assert.doesNotMatch(html, /id="agyQuotaControlRow"|setAgyQuotaControl/));
} else {
function make({debug,native}) {
  const events=[], row={style:{display:'none'}}, button={disabled:false,
    addEventListener(event,fn){this[event]=fn}};
  const window=native?{webkit:{messageHandlers:{tootoo:{}}}}:{};
  vm.runInNewContext(text,{window,DEV_DEBUG_ENABLED:debug,
    document:{getElementById:id=>id.endsWith('Row')?row:button},
    postNative:(name,payload)=>events.push([name,payload]),
    fetchTelemetry:force=>events.push(['refresh',force]),
  });
  return {events,row,button,window};
}
test('ordinary browser and non-Debug app cannot enable the Agy probe',()=>{
  for(const [debug,native] of [[true,false],[false,true],[false,false]]) {
    const h=make({debug,native});
    assert.equal(h.row.style.display,'none');
    assert.equal(h.button.click,undefined);
    assert.equal(h.window.__onAgyQuotaControl,undefined);
    assert.deepEqual(h.events,[]);
  }
});
test('Debug waits for native state, requests confirmation only on real interaction',()=>{
  const {events,row,button,window}=make({debug:true,native:true});
  assert.equal(row.style.display,'none');
  button.click({isTrusted:true});
  assert.equal(events.length,1);
  assert.equal(events[0][0],'getAgyQuotaControl');
  window.__onAgyQuotaControl({enabled:false,busy:false});
  assert.equal(row.style.display,'');
  button.click({isTrusted:false});
  assert.equal(events.length,1);
  button.click({isTrusted:true});
  assert.equal(events[1][0],'setAgyQuotaControl');
  assert.equal(events[1][1].enabled,true);
  window.__onAgyQuotaControl({enabled:true,busy:true});
  button.click({isTrusted:true});
  assert.equal(events.length,2);
  window.__onAgyQuotaControl({enabled:true,busy:false,refresh:true});
  assert.deepEqual(events[2],['refresh',true]);
  button.click({isTrusted:true});
  assert.equal(events[3][1].enabled,false);
});

}
