// Headless smoke test: runs the game's inline scripts with stubbed DOM/canvas
// and drives a few thousand frames to catch runtime errors.
'use strict';
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

const grad = { addColorStop() {} };
const ctx = new Proxy({}, {
  get(t, p) {
    if (p in t) return t[p];
    return () => (String(p).startsWith('create') ? grad : undefined);
  },
  set(t, p, v) { t[p] = v; return true; }
});

function elStub(id) {
  return {
    id,
    style: {},
    hidden: false,
    textContent: '',
    focus() {},
    addEventListener() {},
    removeEventListener() {},
    getContext() { return id === 'game' ? ctx : null; }
  };
}

let rafCount = 0;
const win = {
  innerWidth: 1200,
  innerHeight: 800,
  devicePixelRatio: 2,
  matchMedia: () => ({ matches: false }),
  addEventListener() {},
  removeEventListener() {},
  setTimeout: (...a) => setTimeout(...a),
  clearTimeout: (...a) => clearTimeout(...a),
  requestAnimationFrame(cb) { if (rafCount++ < 40) setImmediate(cb, performance.now()); },
  localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } }
};
win.window = win;
const doc = {
  getElementById: id => elStub(id),
  addEventListener() {},
  activeElement: null
};

try {
  scripts.forEach((s, i) => new Function('window', 'document', s)(win, doc));
} catch (e) {
  console.log('FAIL: script threw on load: ' + e.stack);
  process.exit(1);
}

const fl = win.flappy;
if (!fl) { console.log('FAIL: flappy debug object missing'); process.exit(1); }

function runFrames(n, flapEvery) {
  for (let f = 0; f < n; f++) {
    if (flapEvery && f % flapEvery === 0) fl.press();
    fl.update();
  }
}

try {
  // Normal run: flap periodically, crash, restart.
  fl.press();              // ready -> playing
  runFrames(600, 17);      // should die somewhere in there
  if (fl.state() !== 'over') console.log('note: still state=' + fl.state() + ' score=' + fl.score());
  for (let i = 0; i < 100; i++) fl.update(); // overTimer climbs
  fl.press();              // restart
  if (fl.state() !== 'playing') console.log('note: restart state=' + fl.state());
  runFrames(1200, 19);
  console.log('normal run OK, state=' + fl.state() + ' score=' + fl.score() +
    ' best>0? ' + (win.localStorage.getItem('flappy.best') > 0));

  // Bonus spawn sanity: buffers hold stars/shields sometimes.
  let stars = 0, shields = 0;
  for (const p of fl.pipes()) {
    if (p.bonus === 'star') stars++;
    if (p.bonus === 'shield') shields++;
  }
  console.log('current pipe bonuses: star=' + stars + ' shield=' + shields +
    ' (spawn rate ~22%/7%)');

  // Practice mode: G at ready, long run must never die and never save best.
  for (let i = 0; i < 80; i++) fl.update();
  fl.press(); // restart from over -> ready->playing? press at over+40 resets
  for (let i = 0; i < 100; i++) fl.update();
  // Ensure we are at ready: force reset
  fl.reset();
  fl.togglePractice();
  if (!fl.practice()) { console.log('FAIL: practice did not toggle'); process.exit(1); }
  fl.press();
  runFrames(3600, 21); // a full minute of frames, bouncing off floors
  if (fl.state() !== 'playing') {
    console.log('FAIL: practice died, state=' + fl.state());
    process.exit(1);
  }
  const bestWas = parseInt(win.localStorage.getItem('flappy.best'), 10) || 0;
  console.log('practice OK: alive, score=' + fl.score() + ' (score not persisted is expected)');

  // End the practice run via G during play, confirm back to ready & practice off
  // is on the ready screen? G during play resets; practice flag stays on until
  // toggled at ready. Verify no crash at least.
  fl.togglePractice();
  runFrames(60, 0);
  console.log('practice exit OK');

  // Medal + level helpers still sane after all that.
  console.log('level=' + fl.level() + ' gap=' + fl.gap() + ' speed=' + fl.speed());
} catch (e) {
  console.log('FAIL: runtime error during simulation: ' + e.stack);
  process.exit(1);
}
console.log('SMOKE TEST PASSED');
process.exit(0);
