const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2], 'utf8');
const styles = [...source.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].map(m=>m[0]).join('\n');
const renderer = source.slice(source.indexOf('function renderAgents('), source.indexOf('let qcfgState = '));
if (!renderer.includes('quota-item')) throw Error('fixture source omitted renderer');
const labels = [
  'Gemini Models · Weekly','Gemini Models · 5h',
  'Claude and GPT models · Weekly','Claude and GPT models · 5h',
];
const target = {querySelectorAll: () => []};
vm.runInNewContext(renderer + '\nrenderAgents(fixture);', {
  fixture: {kpi:{tokens:618900},tools:[{tool:'antigravity',label:'Antigravity (agy)',tokens:618900,cost:2,cache_hit:78,
    accent:'#E54826',quota:{source:'cli_cached',buckets:[10,13,0,0].map((used_percent,i)=>({used_percent,label:labels[i],resets_at:i+1}))}}]},
  document: {getElementById:id=>id==='agentList'?target:null},
  localStorage: {getItem:()=>null},
  esc:String, fmtNum:String, fmtCostRich:String, splitNumUnit:String,
  fmtResetTime:i=>['','6天17h','3h7m','6天23h','4h59m'][i],
});
fs.writeFileSync(process.argv[3], `<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
${styles}<style>body {display:block; margin:0; padding:12px; min-width:0; min-height:0;}
#agentList {display:block;}</style><div id="agentList">${target.innerHTML}</div></html>`);
