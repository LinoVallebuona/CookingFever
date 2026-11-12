// End-to-end play-through of level 1 through the real UI.
// The heuristic test bot (exposed only in dev builds) decides what to do and
// Playwright performs the matching taps and drags on the actual DOM.
// Requires: `npm run dev` running and Playwright with Chromium installed.
//   npm run e2e            (optionally: BASE_URL=http://localhost:5173)
const { chromium } = require('playwright');
const LEVEL = 1;
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const SHOTS = process.env.SHOTS_DIR ?? require('os').tmpdir();
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('401')) errors.push(m.text()); });
  await page.goto(BASE_URL);
  await page.click('[data-testid=guest-button]');
  await page.waitForSelector('[data-testid=play-button]');
  await page.click('[data-testid=play-button]');
  await page.click(`[data-testid=level-${LEVEL}]`);
  await page.click('[data-testid=level-play]');
  await page.click('[data-testid=start-shift]');
  await page.waitForTimeout(2400);
  const center = async (sel) => {
    const b = await page.locator(sel).first().boundingBox();
    if (!b) throw new Error('no element ' + sel);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  const drag = async (from, to) => {
    const a = await center(from), b = await center(to);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(a.x + 20, a.y - 20, { steps: 3 });
    await page.mouse.move(b.x, b.y, { steps: 6 });
    await page.mouse.up();
  };
  let n = 0, shot = 0;
  for (;;) {
    const info = await page.evaluate(() => {
      const g = window.__sizzleGame; const bot = window.__sizzleBot;
      if (!g || !bot) return { wait: true };
      if (g.engine.finished) return { done: true };
      return { action: bot.chooseBotAction(g.engine), t: g.engine.state.time };
    });
    if (info.done) break;
    const a = info.action;
    if (a) {
      n++;
      try {
        switch (a.type) {
          case 'bin': a.plate !== undefined ? await drag(`[data-station="bin:${a.bin}"]`, `[data-station="plate:${a.plate}"]`) : await page.click(`[data-station="bin:${a.bin}"]`); break;
          case 'grill': a.plate !== undefined ? await drag(`[data-station="grill:${a.slot}"]`, `[data-station="plate:${a.plate}"]`) : await page.click(`[data-station="grill:${a.slot}"]`); break;
          case 'plate': await page.click(`[data-station="plate:${a.plate}"]`); break;
          case 'fryer': await page.click(`[data-station="fryer:${a.basket}"]`); break;
          case 'warmer': await page.click(`[data-station="warmer"]`); break;
          case 'cup': await page.click(`[data-station="cup:${a.slot}"]`); break;
          case 'shaker': await page.click(`[data-station="shaker:${a.slot}"]`); break;
          case 'discard': await drag(`[data-station="${a.station}:${a.index}"]`, '[data-drop="trash"]'); break;
        }
      } catch (e) { errors.push('action failed ' + JSON.stringify(a) + ' ' + e.message); }
      if (n % 40 === 20 && shot < 3) await page.screenshot({ path: `${SHOTS}/L${LEVEL}-play-${++shot}.png` });
    }
    await page.waitForTimeout(250);
  }
  await page.waitForSelector('[data-testid=reward]', { timeout: 15000 });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${SHOTS}/L${LEVEL}-results.png` });
  const title = await page.textContent('[data-testid=results-title]');
  const balance = await page.evaluate(() => document.querySelector('[data-testid=reward]')?.textContent);
  console.log('actions', n, '| title:', title, '| reward:', balance);
  // continue to level 2 and check the profile persisted after reload
  await page.click('[data-testid=results-map]');
  await page.waitForTimeout(600);
  await page.reload();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/after-reload.png` });
  console.log('coins after reload:', await page.textContent('[data-testid=coin-balance]'));
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  if (errors.length) process.exitCode = 1;
  await browser.close();
})();
