# QA handoff: `index.html`

## Scope and method

- Reviewed the single-file Flappy Bird canvas game in `index.html`.
- Ran a JavaScript syntax parse of the inline script with Node.js v24.22.1: **passed**.
- Browser automation was unavailable in this session, so rendering, keyboard/touch play, scoring, collisions, audio, persistence, and resizing were not exercised in a live browser.

## Findings

### P1 — Browser zoom is disabled

**Location:** `index.html:5`

The viewport meta tag sets `maximum-scale=1` and `user-scalable=no`. This prevents users from zooming the page, which can make the game and its text inaccessible to people who need magnification.

**Suggested fix:** Remove `maximum-scale` and `user-scalable`; keep `width=device-width, initial-scale=1` so browser zoom remains available.

### P1 — Game information is only drawn to an unlabeled canvas

**Location:** `index.html:26`, with game instructions and score drawn in `drawUI()` around line 526.

The canvas has no accessible name, role, fallback text, or equivalent DOM representation. Screen readers do not receive the controls, current score, best score, level, or game-over/restart state. The visible `SPACE or TAP` instructions are also canvas pixels, not accessible text.

**Suggested fix:** Give the canvas an accessible name and provide real DOM instructions plus a live status element for score/state updates. Make sure the interaction has a keyboard-accessible focus path and does not rely on canvas-only text.

## Areas reviewed

- Input listeners handle Space, Arrow Up, W, Enter, and pointer down; repeated keydown events are ignored.
- The game has guarded local-storage reads/writes and graceful fallbacks for storage errors.
- The resize routine scales the fixed 360×640 drawing area to fit the viewport.
- Collision and scoring logic use the bird's bounding box and pipe positions.
- Web Audio sound effects are synthesized, so the game does not require external audio assets.

These are code-review observations, not live-browser confirmations.

## Recommended next verification

After addressing the accessibility findings, open the page in a desktop and mobile browser and verify: initial screen, each supported keyboard input, pointer/touch flap, collision/game-over, restart delay, score and best-score persistence, audio after the first gesture, and narrow/rotated viewport sizing.
