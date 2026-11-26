const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {test} = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../ui/index.html'), 'utf8');
const helpers = html.slice(html.indexOf('function pickCodexQuotaBucket('), html.indexOf('const numAnimState = {}'));

function render(mode, quotas) {
  const shown = new Set();
  const els = Object.fromEntries(['topQuota', 'tqName', 'tqPct', 'tqFill', 'tqRst'].map(
    id => [id, {style: {}, classList: {add: c => shown.add(c), remove: c => shown.delete(c)}, removeAttribute() {}}],
  ));
  vm.runInNewContext(helpers + '\nrenderTopQuota({ quotas });', {
    quotas, menuBarQuotaBar: mode,
    document: {getElementById: id => els[id]},
    fmtResetTime: value => String(value),
  });
  return [shown.has('show'), els.tqName.textContent, els.tqPct.textContent];
}

const weekly = used_percent => ({used_percent, window_minutes: 10080});
const short = used_percent => ({used_percent, window_minutes: 300});
const agy = (key, used_percent) => ({key: 'antigravity:' + key, used_percent});

test('weekly Codex in either slot takes precedence, with a valid zero', () => {
  assert.deepEqual(render('codex', {codex: {primary: short(60), secondary: weekly(0)}}), [true, 'Codex 周', '剩 100%']);
  assert.deepEqual(render('codex', {codex: {primary: weekly(90), secondary: short(20)}}), [true, 'Codex 周', '剩 10%']);
  assert.deepEqual(render('codex', {codex: {primary: null, secondary: short(10)}}), [true, 'Codex', '剩 90%']);
});

test('explicit sources never silently fall back; only automatic prefers first available', () => {
  const codex = {primary: weekly(60)};
  const buckets = [agy('cg_5h', 20), agy('gemini_7d', 40), agy('gemini_5h', 80)];
  assert.deepEqual(render('cg5h', {codex, antigravity: {buckets}}), [true, 'C/G 5h', '剩 80%']);
  assert.deepEqual(render('gem7d', {codex, antigravity: {buckets: [buckets[2], buckets[0]]}}), [true, 'Gemini', '暂无数据']);
  assert.deepEqual(render('gem5h', {codex}), [true, 'Gemini 5h', '暂无数据']);
  assert.deepEqual(render('gem5h', {codex, antigravity: {buckets}}), [true, 'Gemini 5h', '剩 20%']);
  assert.deepEqual(render('auto', {codex, antigravity: {buckets}}), [true, 'Gemini 5h', '剩 20%']);
  assert.deepEqual(render('auto', {codex}), [true, 'Codex 周', '剩 40%']);
  assert.equal(render('auto', {})[0], false);
  assert.equal(render('none', {codex, antigravity: {buckets}})[0], false);
  assert.deepEqual(render('gem5h', {codex: {primary: null}, antigravity: {buckets: [agy('gemini_5h', null)]}}), [true,'Gemini 5h','暂无数据']);
});

test('persisted Gemini stays pinned, and Argon is shown only if reported or already selected', () => {
  const controls = html.slice(html.indexOf('let menuBarFields = ['),html.indexOf('const state = {'));
  const chip = dataset => ({dataset, hidden:true, classList:{toggle(){}}});
  const argonBar = chip({qbar:'argon7d'}), argonText = chip({field:'q_argon7d'});
  for (const [saved, expected] of [['gem7d','gem7d'], [null,'auto'], ['argon7d','argon7d']]) {
    const state = {data:null};
    const ctx = vm.createContext({ state, window:{},
      localStorage:{getItem:()=>saved},
      document:{querySelectorAll:sel=>[sel.includes('mbQuotaBar')?argonBar:argonText]},
      renderTopQuota(){},
    });
    vm.runInContext(controls+'\nrenderMenuBarCfgChips()',ctx);
    assert.equal(vm.runInContext('menuBarQuotaBar',ctx),expected);
    assert.equal(argonBar.hidden,expected!=='argon7d');
    assert.equal(argonText.hidden,true);
    vm.runInContext('window.__onMenuBarFields(["q_argon7d"], "gem5h")',ctx);
    assert.equal(vm.runInContext('menuBarQuotaBar',ctx),'gem5h');
    assert.equal(argonBar.hidden,true);
    assert.equal(argonText.hidden,false);
    state.data = {quotas:{antigravity:{buckets:[agy('argon_7d',0)]}}};
    vm.runInContext('renderMenuBarCfgChips()',ctx);
    assert.equal(argonBar.hidden,false);
  }
  assert.match(html,/Gemini 4 Argon 周额度/);
  assert.match(html,/不是 Gemini 通用周额度/);
});
