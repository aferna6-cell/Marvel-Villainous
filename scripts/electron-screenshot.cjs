// Headless Electron screenshot — boots the built renderer under xvfb,
// drives through a few in-game clicks, and saves a PNG of the rendered
// window after each step. Run with:
//
//   xvfb-run -a node node_modules/electron/cli.js --no-sandbox scripts/electron-screenshot.cjs

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  await app.whenReady();
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  async function snap(name) {
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(OUT, `${name}.png`), img.toPNG());
    console.log(`saved screenshots/${name}.png`);
  }

  async function click(selector) {
    const result = await win.webContents.executeJavaScript(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return { ok: false, reason: 'no element' };
      el.click();
      return { ok: true };
    })()`);
    if (!result.ok) console.warn(`click ${selector} → ${result.reason}`);
    await new Promise((r) => setTimeout(r, 200));
  }

  async function clickByText(text) {
    const result = await win.webContents.executeJavaScript(`(() => {
      const all = Array.from(document.querySelectorAll('button, a'));
      const hit = all.find((el) => (el.textContent || '').trim().includes(${JSON.stringify(text)}));
      if (!hit) return { ok: false };
      hit.click();
      return { ok: true, tag: hit.tagName };
    })()`);
    if (!result.ok) console.warn(`click "${text}" → not found`);
    await new Promise((r) => setTimeout(r, 250));
  }

  try {
    const fileUrl = `file://${path.join(__dirname, '..', 'dist', 'index.html')}`;
    await win.loadURL(fileUrl);
    await new Promise((r) => setTimeout(r, 400));

    await snap('01-main-menu');

    await clickByText('New Game');
    await snap('02-villain-picker');

    await clickByText('Solo · thanos');
    await snap('03-game-start');

    // Click Location 3 to move.
    await win.webContents.executeJavaScript(`(() => {
      const locs = Array.from(document.querySelectorAll('.location'));
      const l3 = locs.find((l) => /Location 3/.test(l.textContent || ''));
      if (l3) l3.click();
    })()`);
    await new Promise((r) => setTimeout(r, 250));
    await snap('04-after-move');

    // Click any enabled gainPower icon.
    await win.webContents.executeJavaScript(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const ic = btns.find((b) => /gainPower/.test(b.textContent || '') && !b.disabled);
      if (ic) ic.click();
    })()`);
    await new Promise((r) => setTimeout(r, 250));
    await snap('05-after-icon');

    // Click Suggest a move.
    await clickByText('Suggest a move');
    await snap('06-advisor');

    // End turn.
    await clickByText('End turn');
    await snap('07-end-turn');

    app.exit(0);
  } catch (e) {
    console.error('screenshot error:', e);
    app.exit(1);
  }
})();
