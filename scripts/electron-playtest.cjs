// Deeper Electron playtest — boots the built renderer under xvfb, runs
// through several flows, captures PNGs at each step, and reports any
// JavaScript errors or unhandled promise rejections that fired in the
// renderer process. Writes screenshots/playtest-NN.png and prints a
// summary to stdout.

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  await app.whenReady();
  const win = new BrowserWindow({
    width: 1500,
    height: 1800, // tall enough to capture both realms + controls + hand
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  const rendererErrors = [];
  win.webContents.on('console-message', (_e, level, message) => {
    if (level >= 2) rendererErrors.push(`[level=${level}] ${message}`);
  });
  win.webContents.on('render-process-gone', (_e, details) => {
    rendererErrors.push(`render gone: ${JSON.stringify(details)}`);
  });

  let step = 0;
  async function snap(label) {
    step++;
    const name = `playtest-${String(step).padStart(2, '0')}-${label}`;
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(OUT, `${name}.png`), img.toPNG());
    console.log(`saved screenshots/${name}.png`);
  }

  async function clickByText(text, opts = {}) {
    const scope = opts.scope ?? '';
    const result = await win.webContents.executeJavaScript(`(() => {
      const scope = ${JSON.stringify(scope)};
      const root = scope ? document.querySelector(scope) : document;
      if (!root) return { ok: false, count: 0, reason: 'no scope' };
      const all = Array.from(root.querySelectorAll('button, a, label'));
      const matches = all.filter((el) => (el.textContent || '').trim() === ${JSON.stringify(text)} ||
                                          (el.textContent || '').trim().includes(${JSON.stringify(text)}));
      const exact = all.filter((el) => (el.textContent || '').trim() === ${JSON.stringify(text)});
      const pool = exact.length > 0 ? exact : matches;
      const idx = ${JSON.stringify(opts.index ?? 0)};
      const hit = pool[idx];
      if (!hit) return { ok: false, count: pool.length };
      hit.click();
      return { ok: true, tag: hit.tagName, count: pool.length };
    })()`);
    if (!result.ok) console.warn(`! click "${text}" idx=${opts.index ?? 0} scope=${scope} → not found (matches=${result.count})`);
    await new Promise((r) => setTimeout(r, 250));
    return result;
  }

  async function clickSeat(seatIdx, villainName) {
    const r = await win.webContents.executeJavaScript(`(() => {
      const seats = Array.from(document.querySelectorAll('.picker-seat'));
      const seat = seats[${seatIdx}];
      if (!seat) return { ok: false, reason: 'no seat' };
      const btn = Array.from(seat.querySelectorAll('button')).find(
        (b) => (b.textContent || '').trim() === ${JSON.stringify(villainName)},
      );
      if (!btn) return { ok: false, reason: 'no villain button' };
      btn.click();
      return { ok: true };
    })()`);
    if (!r.ok) console.warn(`! seat ${seatIdx} ${villainName} → ${r.reason}`);
    await new Promise((r) => setTimeout(r, 250));
    return r;
  }

  async function clickLocation(n) {
    const r = await win.webContents.executeJavaScript(`(() => {
      const locs = Array.from(document.querySelectorAll('.location'));
      const m = locs.find((l) => /Location ${n}/.test(l.textContent || ''));
      if (!m) return { ok: false };
      m.click();
      return { ok: true };
    })()`);
    await new Promise((r) => setTimeout(r, 250));
    return r;
  }

  async function clickIcon(text) {
    const r = await win.webContents.executeJavaScript(`(() => {
      const btns = Array.from(document.querySelectorAll('.icon'));
      const m = btns.find((b) => !b.disabled && new RegExp(${JSON.stringify(text)}).test(b.textContent || ''));
      if (!m) return { ok: false };
      m.click();
      return { ok: true };
    })()`);
    await new Promise((r) => setTimeout(r, 250));
    return r;
  }

  try {
    const fileUrl = `file://${path.join(__dirname, '..', 'dist', 'index.html')}`;
    await win.loadURL(fileUrl);
    await new Promise((r) => setTimeout(r, 400));

    await snap('main-menu');
    await clickByText('New Game');
    await snap('villain-picker');

    // Pick Killmonger vs Taskmaster (a combo that wasn't available before).
    await clickSeat(0, 'Killmonger');
    await clickSeat(1, 'Taskmaster');
    await snap('picker-filled');
    await clickByText('Start 2-Player Game');
    await snap('game-start');

    // Move to Location 2.
    await clickLocation(2);
    await snap('after-move');

    // Try to use an icon.
    await clickIcon('gainPower');
    await snap('after-gainPower');

    // Open the advisor (directive plan view).
    await clickByText('Suggest my next move');
    await snap('advisor-open');
    // Close the advisor so the click-to-play step isn't blocked.
    await clickByText('Ignore');

    // Click a card in the hand to play it at the current location.
    await win.webContents.executeJavaScript(`(() => {
      const slot = document.querySelector('.hand__card-slot');
      if (slot) slot.click();
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    await snap('after-click-play');

    // Toggle strict icons on.
    await clickByText('Strict icons');
    await snap('strict-on');
    await clickByText('Strict icons'); // toggle off
    await snap('strict-off');

    // End the active player's turn — should trigger a pass-device curtain.
    await clickByText('End turn');
    await snap('pass-curtain');

    // Dismiss the pass-device curtain (button text is "Ready").
    await clickByText('Ready');
    await snap('after-curtain');

    // p2's turn — drive a Fate.
    await clickLocation(2);
    await snap('p2-after-move');
    await clickByText('Fate');
    await snap('p2-fate-prompt');
    // Resolve fate by picking the first non-skip choice (target opponent).
    await win.webContents.executeJavaScript(`(() => {
      const panel = document.querySelector('.fate-panel, .prompt-panel');
      if (!panel) return;
      const btns = Array.from(panel.querySelectorAll('button'));
      const target = btns.find((b) => !(/Skip|Discard|skip/i.test(b.textContent || '')));
      if (target) target.click();
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    await snap('p2-fate-resolved');
    // If a place-location prompt is parked, pick Location 1.
    await win.webContents.executeJavaScript(`(() => {
      const panel = document.querySelector('.fate-panel, .prompt-panel');
      if (!panel) return;
      const loc = Array.from(panel.querySelectorAll('button')).find((b) => /Location 1/.test(b.textContent || ''));
      if (loc) loc.click();
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    await snap('p2-fate-placed');

    // Try ACTIVATE — find an activate icon.
    await clickIcon('activate');
    await snap('p2-activate-prompt');
    // Skip the activate prompt if parked.
    await win.webContents.executeJavaScript(`(() => {
      const panel = document.querySelector('.prompt-panel');
      if (!panel) return;
      const skip = Array.from(panel.querySelectorAll('button')).find((b) => /Skip/i.test(b.textContent || ''));
      if (skip) skip.click();
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    await snap('p2-after-activate');

    // Play a card from hand via direct dispatch (drag-and-drop simulation
    // is brittle in headless mode, so we click the first card's name and
    // dispatch via the engine handle — actually, just call the engine).
    await win.webContents.executeJavaScript(`(() => {
      const cards = Array.from(document.querySelectorAll('.hand .card'));
      const first = cards[0];
      if (!first) return;
      // Find a location to drop onto.
      const loc = document.querySelector('.realm:not(.realm--readonly) .location.location--current');
      if (!loc) return;
      // Synthesize a drop event with the card's data.
      const cardId = (first.getAttribute('title') || '').split(' — ')[0] || first.querySelector('.card__name')?.textContent;
      // Drag-and-drop is hard to fake — instead, leave a marker for the test.
      first.style.outline = '2px solid hotpink';
    })()`);
    await snap('p2-card-highlighted');

    // End p2's turn.
    await clickByText('End turn');
    await snap('p2-end-turn');
    // Dismiss pass-device for p1.
    await clickByText('Ready');
    await snap('p1-turn-2');

    // Quit back to menu.
    await clickByText('Quit');
    await snap('back-to-menu');

    console.log('errors captured:', rendererErrors.length);
    for (const e of rendererErrors) console.log('  -', e);
    app.exit(rendererErrors.length > 0 ? 1 : 0);
  } catch (e) {
    console.error('playtest error:', e);
    app.exit(99);
  }
})();
