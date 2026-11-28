const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const html = readFileSync(join(__dirname, '../ui/index.html'), 'utf8');

test('total usage shows one cache hit rate alongside input and output', () => {
  const card = html.match(/<div class="card" data-kpi="tokens"[\s\S]+?(?=<div class="card" data-kpi="cost")/)[0];
  assert.match(card, /class="hero-sub token-summary">\s*<span id="kpiInOut">[^<]+<\/span>\s*<span id="kpiCache">[^<]+<\/span>\s*<\/div>/);
  assert.doesNotMatch(card, /cachePill/);
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, {style: {}});
    return elements.get(id);
  }};
  const fmt = html.slice(html.indexOf('function fmtNum('), html.indexOf('function esc('));
  const render = html.slice(html.indexOf('function renderHero('), html.indexOf('function renderDailyChart('));
  const draw = runInNewContext(fmt + render + '\nrenderHero', {document, animateMetric() {}});
  const kpi = {tokens: 446960000, in: 24290000, out: 1170000, cr: 420210000, cache_hit: 94.5, requests: 2286, sessions: 88};
  draw({kpi});
  assert.equal(elements.get('kpiInOut').textContent, '输入24.29M · 输出1.17M');
  assert.equal(elements.get('kpiCache').textContent, '命中率94.5%');
  assert.equal(elements.get('kpiCache').title, '缓存命中 420.21M Token');
  draw({kpi: {...kpi, cr: 0, cache_hit: 0}});
  assert.equal(elements.get('kpiCache').textContent, '命中率0%');
});

test('hero cards share title, value, chart and caption rows without a cost-only offset', () => {
  const grid = html.match(/<section class="hero-grid">[\s\S]+?<\/section>/)[0];
  assert.equal((grid.match(/class="hero-sub\b/g) || []).length, 4);
  assert.doesNotMatch(grid, /class="hero-sub"\s+style=/);
  assert.match(html, /\.hero-grid \.card-head \{ grid-row: 1; \}/);
  assert.match(html, /\.hero-grid \.hero-val \{\s+grid-row: 2;/);
  assert.match(html, /\.hero-grid :is\(\.stack-bar, \.gauge-track\) \{ grid-row: 3; \}/);
  assert.match(html, /\.hero-grid \.hero-sub \{ grid-row: 4; \}/);
});
