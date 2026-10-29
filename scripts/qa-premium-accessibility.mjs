import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire('C:/Users/LOQ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const { chromium } = require('playwright');
const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:3022';
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const results = [], metrics = [];
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/kham-pha', '/chuyen-muc/dat-nam-bo', '/tu-dien', '/tri-thuc', '/ban-do']) {
      await page.goto(origin + path); await page.locator('main h1').waitFor();
      await page.addScriptTag({ path: 'outputs/qa-tools/node_modules/axe-core/axe.min.js' });
      const result = await page.evaluate(async () => { const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }); return { violations: r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), passes: r.passes.length, incomplete: r.incomplete.map(v => v.id) }; });
      results.push({ width, path, ...result });
    }
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const perf = await context.newPage();
    await perf.addInitScript(() => {
      window.qaVitals = { lcp: null, cls: 0, interactions: [] };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) window.qaVitals.lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.qaVitals.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (entry.interactionId) window.qaVitals.interactions.push(entry.duration); }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    });
    await perf.goto(origin); await perf.locator('main h1').waitFor(); await perf.locator('.hx-image').evaluate(el => el.decode());
    await perf.waitForLoadState('networkidle');
    await perf.getByRole('tab', { name: 'bển', exact: true }).click();
    await perf.keyboard.press('ArrowRight');
    await perf.screenshot({ path: `outputs/premium-qa/perf-${width}.png` });
    metrics.push({ width, ...(await perf.evaluate(() => ({ ...window.qaVitals, resources: performance.getEntriesByType('resource').filter(e => /leaflet|maplibre/.test(e.name)).map(e => e.name) }))) });
    await context.close();
  }
  await mkdir('outputs/premium-qa', { recursive: true });
  await writeFile('outputs/premium-qa/accessibility.json', JSON.stringify({ results, metrics, scope: 'Automated axe checks and local lab samples; not a complete WCAG audit or real-user CWV assessment.' }, null, 2));
  console.log(JSON.stringify({ violations: results.filter(r => r.violations.length), metrics }, null, 2));
} finally { await browser.close(); }
