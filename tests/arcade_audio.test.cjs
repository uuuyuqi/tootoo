const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const html = readFileSync(process.env.TOOTOO_TEST_HTML || join(__dirname, "../ui/index.html"), "utf8");
const source = html.slice(html.indexOf("let sfxEnabled = false;"), html.indexOf("// ---- 5-Second Stardust"));
const settled = () => new Promise((resolve) => setImmediate(resolve));
function makeSfx({ enabled = true, state = "running", resume } = {}) {
  const contexts = [], listeners = {}, button = {
    addEventListener: (_, fn) => { button.click = fn; },
    setAttribute: (name, value) => { button[name] = value; },
  };
  const events = [];
  class AudioContext {
    constructor() { this.state = state; this.resumes = 0; this.currentTime = 0; this.destination = {}; contexts.push(this); }
    resume() {
      this.resumes += 1;
      if (resume) return resume(this);
      this.state = "running";
      return Promise.resolve();
    }
    createOscillator() {
      if (this.state === "closed") throw new Error("closed context");
      return { frequency: { setValueAtTime() {} }, connect() {}, start() { events.push("tone"); }, stop() {} };
    }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
  }
  const scope = vm.createContext({ window: { AudioContext }, performance,
    localStorage: { getItem: () => enabled ? "1" : "0", setItem() {} },
    document: { getElementById: () => button, addEventListener: (event, fn) => { listeners[event] = fn; } },
  });
  vm.runInContext(source, scope);
  return { contexts, listeners, events, button, play: () => vm.runInContext('playSfx("go")', scope) };
}

test("interrupted context resumes while SFX setting is already enabled", () => {
  const { contexts, events, play } = makeSfx();
  play();
  const ctx = contexts[0];
  ctx.state = "interrupted";
  play();
  assert.equal(ctx.resumes, 1);
  assert.equal(events.length, 1, "don't queue an old tone while WebKit is interrupted");
  play();
  assert.equal(events.length, 2);
});

test("the next sound after AudioContext closes creates a fresh context", () => {
  const { contexts, play, events } = makeSfx();
  play();
  contexts[0].state = "closed";
  play();
  assert.equal(contexts.length, 2);
  assert.equal(events.length, 2);
});

test("trusted input retries background-blocked audio without queueing game tones", async () => {
  let allow = false;
  const { contexts, listeners, events, play } = makeSfx({
    state: "suspended",
    resume(ctx) {
      if (!allow) return new Promise(() => {});
      ctx.state = "running";
      return Promise.resolve();
    },
  });
  play(); play();
  assert.equal(contexts[0].resumes, 1);
  assert.equal(events.length, 0);
  listeners.click({ isTrusted: false });
  assert.equal(contexts[0].resumes, 1);
  allow = true;
  listeners.keydown({ isTrusted: true });
  assert.equal(contexts[0].resumes, 2);
  await settled();
  play();
  assert.equal(events.length, 1);
});

test("mute does not create a context; rejected resumes recover on next user input", async () => {
  let allow = false;
  const { contexts, listeners, events, button, play } = makeSfx({
    enabled: false,
    state: "suspended",
    resume(ctx) {
      if (!allow) return Promise.reject(new Error("autoplay blocked"));
      ctx.state = "running";
      return Promise.resolve();
    },
  });
  play();
  assert.equal(contexts.length, 0);
  assert.equal(button.textContent, "🔇 静音");
  button.click();
  await settled();
  assert.equal(button.textContent, "🔊 音效");
  assert.equal(events.length, 0);
  allow = true;
  listeners.click({ isTrusted: true });
  await settled();
  play();
  assert.equal(events.length, 1);
});


test("enabling audio plays its test chime and muting prevents further tones", () => {
  const { contexts, events, button, play } = makeSfx({ enabled: false });
  assert.equal(button["aria-pressed"], "false");
  button.click();
  assert.equal(button["aria-pressed"], "true");
  assert.equal(events.length, 3);
  assert.equal(contexts.length, 1);
  button.click();
  assert.equal(button["aria-pressed"], "false");
  play();
  assert.equal(events.length, 3);
});
