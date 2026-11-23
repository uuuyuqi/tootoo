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

test('selected quota is respected, otherwise ordered fallback with only official buckets', () => {
  const codex = {primary: weekly(60)};
  const buckets = [agy('cg_5h', 20), agy('gemini_7d', 40), agy('gemini_5h', 80)];
  assert.deepEqual(render('cg5h', {codex, antigravity: {buckets}}), [true, 'C/G 5h', '剩 80%']);
  assert.deepEqual(render('gem7d', {codex, antigravity: {buckets: [buckets[2], buckets[0]]}}), [true, 'Gemini 5h', '剩 20%']);
  assert.deepEqual(render('gem5h', {codex, antigravity: {buckets: buckets.slice(0, 2)}}), [true, 'Gemini 周', '剩 60%']);
  assert.deepEqual(render('gem5h', {codex, antigravity: {buckets: [buckets[0]]}}), [true, 'C/G 5h', '剩 80%']);
  assert.deepEqual(render('gem5h', {codex}), [true, 'Codex 周', '剩 40%']);
  assert.equal(render('none', {codex, antigravity: {buckets}})[0], false);
  assert.equal(render('gem5h', {codex: {primary: null}, antigravity: {buckets: [agy('gemini_5h', null)]}})[0], false);
});
