# QA handoff: `index.html`

## QA run: 2026-11-01

### Scope and method

- Ran the repository's existing Node.js harnesses with Node.js v24.22.1: `smoke-test.js`, `bot-test.js`, and `batch-test.js`. All exited successfully.
- The harnesses load and execute the inline game script with stubbed DOM/canvas APIs. They simulate gameplay and inspect the game's debug surface and local storage; they do not render pixels in a real browser.
- Attempted a live browser check. The browser access host was unavailable, and navigation in the open Edge window did not reach the local game. Rendering, actual keyboard/touch input, audio, and viewport behavior therefore remain unverified live.

### Results

- **Smoke test: passed.** Runtime simulation completed, practice mode remained alive through 3,600 simulated frames, and the harness exited successfully.
- **Bot test: passed.** The simulated run scored 46 points, saved best score 46, and collected a shield bonus.
- **Feature batch: passed.** Ghost seed/course reuse, daily score isolation, settings pause and persistence, achievements storage, and practice/daily mutual exclusion all passed.
- The bot and batch harnesses exercised scoring and persistence paths; the smoke harness by itself ended in a playing state with score 0 after its restart sequence, so it is not evidence of score progression on its own.

### Findings

No failures were found in the automated harnesses.

The two accessibility issues listed in the previous handoff appear addressed in the current source:

- The viewport declaration now allows browser zoom (`width=device-width, initial-scale=1`).
- The game wrapper has an accessible name, instructions and HUD are exposed in the DOM, and a live status region mirrors game events. The canvas is hidden from assistive technology and includes fallback text.

These source checks are not a substitute for checking the experience with a screen reader or real browser.

### Remaining live verification

Open `index.html` in a desktop and mobile browser and verify initial rendering, Space/Arrow Up/W/Enter input, pointer/touch flap, collision and game-over, restart timing, score and best-score display, audio after a user gesture, narrow and rotated viewport sizing, and keyboard/screen-reader access to instructions and status.
