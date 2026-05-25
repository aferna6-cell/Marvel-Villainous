// Headless Electron smoke test — launches the built app under xvfb,
// waits for the main BrowserWindow's renderer to finish loading, asserts
// that the React root mounted, then exits with code 0 on success / 1 on
// failure. Run with:
//
//   xvfb-run -a node node_modules/electron/cli.js --no-sandbox scripts/electron-smoke.cjs
//
// (or via the npm script `pnpm smoke:electron`).

const { app, BrowserWindow } = require('electron');
const path = require('path');

const TIMEOUT_MS = 20_000;

(async () => {
  await app.whenReady();
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  let resolved = false;
  const timer = setTimeout(() => {
    if (resolved) return;
    resolved = true;
    console.error(`electron-smoke: timed out after ${TIMEOUT_MS}ms`);
    app.exit(1);
  }, TIMEOUT_MS);

  try {
    const fileUrl = `file://${path.join(__dirname, '..', 'dist', 'index.html')}`;
    await win.loadURL(fileUrl);
    // Wait one tick for React to mount, then probe the DOM.
    const result = await win.webContents.executeJavaScript(
      `(() => ({
         title: document.title,
         hasTitle: !!document.querySelector('.title'),
         menuText: document.querySelector('.title')?.textContent || '',
         bodyLen: document.body?.innerText?.length || 0,
       }))()`,
    );
    clearTimeout(timer);
    if (resolved) return;
    resolved = true;
    if (!result.hasTitle || result.menuText !== 'Marvel Villainous') {
      console.error('electron-smoke: main menu did not render', result);
      app.exit(2);
      return;
    }
    console.log('electron-smoke: OK', result);
    app.exit(0);
  } catch (e) {
    clearTimeout(timer);
    if (resolved) return;
    resolved = true;
    console.error('electron-smoke: error', e);
    app.exit(3);
  }
})();
