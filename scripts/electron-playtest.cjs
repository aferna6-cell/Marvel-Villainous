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

    // Open the advisor.
    await clickByText('Suggest a move');
    await snap('advisor-open');

    // Expand the whole-turn plans expander.
    await clickByText('Whole-turn plans');
    await snap('advisor-sequences');

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
