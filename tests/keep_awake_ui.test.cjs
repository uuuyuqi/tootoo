const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const html = readFileSync(join(__dirname, '../ui/index.html'), 'utf8');
const code = html.split('// TOOTOO_KEEP_AWAKE_UI_START\n')[1].split('// TOOTOO_KEEP_AWAKE_UI_END')[0];
function harness() {
  let nextTimer = 0;
  const timers = new Map(), sent = [], window = {};
  const now = 123000;
  const make = (dataset = {}) => ({
    dataset, event: {}, attrs: {}, disabled: true,
    classList: {
      values: new Set(),
      toggle(k, on) { if (on) this.values.add(k); else this.values.delete(k); },
      contains(k) { return this.values.has(k); },
    },
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(k, f) { this.event[k] = f; },
  });
  const ui = Object.fromEntries(['keepAwakeBtn','settingsModal','keepAwakeStatus','keepAwakeFeedback'].map(id => [id, make()]));
  const modes = ['off','system','display'].map(awakeMode => make({awakeMode}));
  const durations = ['0','60','120','240','480'].map(awakeDuration => make({awakeDuration}));
  const document = {
    ...make(),
    hidden: false,
    getElementById: (id) => ui[id],
    querySelectorAll: (sel) => sel.includes('Mode') ? modes : durations,
  };
  vm.runInNewContext(code, { window, document,
    Date: {now: () => now}, postNative: (action, extra) => { sent.push({action, ...extra}); return true; },
    setTimeout: (f, delay) => { timers.set(++nextTimer, {f, delay}); return nextTimer; },
    clearTimeout: (id) => timers.delete(id),
  });
  return {window, document, ui, modes, durations, now, timers, sent};
}

test('native-only controls, always present in simple mode HTML and startup', () => {
  assert.match(html, /native-only" id="keepAwakeBtn"/);
  assert.match(html, /native-only" id="keepAwakeCfg"/);
  assert.match(html, /body:not\(\.keep-awake-native\) #keepAwakeBtn,\s*body:not\(\.keep-awake-native\) #keepAwakeCfg \{ display: none !important; \}/);
  assert.match(html, /if \(postNative\("getKeepAwakeState"\)\) document.body.classList.add\("keep-awake-native"\)/);
  assert.doesNotMatch(html, /minimal-mode[^\n{]*(?:#keepAwake|\.pop-footer|\.footer-actions)/);
});

test('footer starts with system mode; settings mode and duration sync from native', () => {
  const {window, ui, sent, modes, durations} = harness();
  ui.keepAwakeBtn.event.click();
  assert.deepEqual(sent, []);
  window.__onKeepAwakeState({mode: 'off', preferredMode: 'display', durationMin: 60});
  assert.equal(ui.keepAwakeBtn.disabled, false);
  assert.equal(modes[0].attrs['aria-pressed'], 'true');
  assert.equal(durations[1].attrs['aria-pressed'], 'true');
  ui.keepAwakeBtn.event.click();
  modes[2].event.click();
  durations[3].event.click();
  window.__onKeepAwakeState({mode: 'display', durationMin: 60});
  assert.match(ui.keepAwakeBtn.title, /屏幕常亮/);
  ui.keepAwakeBtn.event.click();
  assert.deepEqual(sent.map(({mode,durationMin})=>[mode,durationMin]),
                   [['system',60],['display',60],['off',240],['off',60]]);
});

test('countdown only schedules for an open visible modal, and native failure stays off', () => {
  const {window, ui, now, timers, document} = harness();
  window.__onKeepAwakeState({mode: 'system', durationMin: 120, expiresAt: now + 6900000});
  assert.match(ui.keepAwakeStatus.textContent, /1h 55m/);
  assert.equal(timers.size, 0);
  ui.settingsModal.classList.toggle('open', true);
  document.event.visibilitychange();
  assert.equal(timers.size, 1);
  document.hidden = true;
  document.event.visibilitychange();
  assert.equal(timers.size, 0);
  window.__onKeepAwakeState({mode: 'off', durationMin: 120, error: 'macOS 未能开启防休眠'});
  assert.equal(ui.keepAwakeBtn.dataset.mode, 'off');
  assert.equal(ui.keepAwakeBtn.attrs['aria-pressed'], 'false');
  assert.match(ui.keepAwakeStatus.textContent, /未能开启/);
});

test('wake icon has distinct expressions for all three native states', () => {
  const {window, ui} = harness();
  for (const mode of ['off', 'system', 'display']) assert.ok(html.includes(`class="awake-face-${mode}"`));
  assert.match(html, /class="awake-face-display".+class="awake-eye-glints" fill="#fff"/);
  assert.match(html, /#keepAwakeBtn\[aria-pressed="true"\]::after/);
  for (const [mode, pressed] of [['off','false'], ['system','true'], ['display','true'], ['off','false']]) {
    window.__onKeepAwakeState({mode});
    assert.equal(ui.keepAwakeBtn.attrs['aria-pressed'], pressed);
    assert.equal(ui.keepAwakeBtn.dataset.mode, mode);
    assert.doesNotMatch(ui.keepAwakeBtn.title, /☕/);
  }
});

test('footer cycles all three modes; feedback waits for confirmation and reports errors', () => {
  const {window, ui, timers, document, sent} = harness();
  const update = (mode, error) => window.__onKeepAwakeState({mode, durationMin:60, error});
  update('off');
  assert.equal(ui.keepAwakeFeedback.textContent, undefined);
  ui.keepAwakeBtn.event.click();
  assert.equal(ui.keepAwakeFeedback.textContent, '');
  update('off');
  assert.equal(ui.keepAwakeFeedback.textContent, '');
  update('system');
  assert.equal(ui.keepAwakeFeedback.textContent, '已开启防休眠 · 允许息屏');
  assert.equal([...timers.values()][0].delay, 2800);
  [...timers.values()][0].f();
  assert.equal(ui.keepAwakeFeedback.textContent, '');
  ui.keepAwakeBtn.event.click();
  update('display');
  assert.equal(ui.keepAwakeFeedback.textContent, '已开启屏幕常亮');
  assert.equal(ui.keepAwakeFeedback.dataset.tone, 'display');
  ui.keepAwakeBtn.event.click();
  update('off');
  assert.equal(ui.keepAwakeFeedback.textContent, '已关闭防休眠');
  assert.deepEqual(sent.map(x=>x.mode), ['system','display','off']);
  ui.keepAwakeBtn.event.click();
  update('off', 'macOS 未能开启防休眠');
  assert.equal(ui.keepAwakeFeedback.textContent, 'macOS 未能开启防休眠');
  document.hidden = true;
  document.event.visibilitychange();
  assert.equal(ui.keepAwakeFeedback.textContent, '');
});
