// Bot test: drives the bird toward the gap center to exercise scoring,
// near-miss pops, star collection, and best-score persistence.
'use strict';
const fs = require('fs');

function buildHarness() {
  const html = fs.readFileSync('index.html', 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const grad = { addColorStop() {} };
  const ctx = new Proxy({}, {
    get(t, p) { if (p in t) return t[p]; return () => (String(p).startsWith('create') ? grad : undefined); },
    set(t, p, v) { t[p] = v; return true; }
  });
  function elStub(id) {
    return {
      id, style: {}, hidden: false, textContent: '',
      focus() {}, addEventListener() {}, removeEventListener() {},
      getContext() { return id === 'game' ? ctx : null; }
    };
  }
  const win = {
    innerWidth: 1200, innerHeight: 800, devicePixelRatio: 2,
    matchMedia: () => ({ matches: false }),
    addEventListener() {}, removeEventListener() {},
    setTimeout: (...a) => setTimeout(...a),
    clearTimeout: (...a) => clearTimeout(...a),
    requestAnimationFrame() {},
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } }
  };
  win.window = win;
  const doc = { getElementById: id => elStub(id), addEventListener() {}, activeElement: null };
  scripts.forEach(s => new Function('window', 'document', s)(win, doc));
  return win;
}

const win = buildHarness();
const fl = win.flappy;
const bird = fl.bird();

fl.press();

let maxScore = 0, shieldSeen = false, frames = 0;
for (frames = 0; frames < 6000 && fl.state() === 'playing'; frames++) {
  // Target the next pipe's gap center.
  const ahead = fl.pipes().find(p => p.x + 62 > bird.x - 13);
  const targetY = ahead ? ahead.gapY + ahead.gap / 2 : 256;
  if (bird.y > targetY + 4) fl.press();
  fl.update();
  maxScore = Math.max(maxScore, fl.score());
  if (bird.shield) shieldSeen = true;
}

if (fl.state() === 'playing') {
  // Force a death so saveBest path is checked on the way out? scoring path
  // already persisted best each point.
}
const best = parseInt(win.localStorage.getItem('flappy.best'), 10) || 0;
console.log('bot run: frames=' + frames + ' state=' + fl.state() +
  ' maxScore=' + maxScore + ' bestSaved=' + best +
  ' shieldCollected=' + shieldSeen);

if (maxScore === 0) { console.log('FAIL: bot never scored'); process.exit(1); }
if (best < maxScore) { console.log('FAIL: best not persisted, best=' + best + ' score=' + maxScore); process.exit(1); }
console.log('BOT TEST PASSED');
process.exit(0);
