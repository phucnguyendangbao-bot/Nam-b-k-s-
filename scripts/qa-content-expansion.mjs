import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// A disposable local Next server. No requests are sent to production or Sites.
const origin = 'http://127.0.0.1:3017';
const output = new URL('../outputs/content-expansion-qa/', import.meta.url);
await mkdir(output, { recursive: true });
const results = [];
const check = (name, ok) => { assert.ok(ok, name); results.push(name); };
let logs = '';
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3017', '-H', '127.0.0.1'], { cwd: fileURLToPath(new URL('..', import.meta.url)), env: { ...process.env, NEXT_PUBLIC_SITE_URL: origin }, windowsHide: true });
server.stdout.on('data', chunk => { logs += chunk; });
server.stderr.on('data', chunk => { logs += chunk; });
let browser;
try {
  const deadline = Date.now() + 30000;
  while (!logs.includes('Ready in')) {
    if (server.exitCode !== null) throw new Error(`Next exited: ${logs}`);
    if (Date.now() > deadline) throw new Error(`Next not ready: ${logs}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  const get = async path => {
    const response = await fetch(origin + path, { signal: AbortSignal.timeout(20000) });
    const html = await response.text();
    check(`HTTP ${path}`, response.ok && !html.includes('Internal Server Error'));
    check(`Unicode ${path}`, !html.includes('\uFFFD'));
    return html;
  };
  const catalog = await (await fetch(origin + '/api/catalog')).json();
  check('25 reviewed records', catalog.items.length === 25);
  check('Separate review counts', catalog.stats.verified === 25 && catalog.stats.eligible === 25 && catalog.stats.pending === 23 && catalog.stats.total === 48);
  check('45 sources', catalog.stats.sources === 45);
  check('Draft funeral records excluded', !catalog.items.some(item => ['E006', 'E007'].includes(item.id)));
  const publicSitemap = await get('/sitemap.xml');
  const journeyDirectory = await get('/hanh-trinh');
  const draftMapSlugs = ['ven-song-can-tho-tu-pho-cho-den-cho-noi', 'lang-co-long-tuyen-ben-rach-binh-thuy'];
  for (const slug of draftMapSlugs) {
    check(`Draft map tour absent from sitemap ${slug}`, !publicSitemap.includes(slug));
    check(`Draft map tour absent from directory ${slug}`, !journeyDirectory.includes(slug));
    const draft = await fetch(origin + '/hanh-trinh/' + slug);
    const html = await draft.text();
    check(`Draft map tour inaccessible ${slug}`, draft.status === 404 || html.includes('Trang này trôi đâu mất rồi.'));
  }
  for (const item of catalog.items) {
    const html = await get('/ho-so/' + item.slug);
    check(`References ${item.id}`, html.includes('Vị trí đối chiếu:') && html.includes('Phiên bản:'));
    check(`Related reading ${item.id}`, html.includes('class="related-tour"') || html.includes('related-tour is-map'));
  }
  const index = await (await fetch(origin + '/api/search')).json();
  check('Search indexes all records', index.entries.filter(item => ['article', 'word'].includes(item.type)).length === 25);
  const tours = index.entries.filter(item => item.type === 'tour');
  check('7 reading journeys', tours.length === 7);
  for (const tour of tours) await get(tour.href);
  for (const path of ['/', '/kham-pha', '/nguon-tu-lieu', '/hoi-dap', '/ve-du-an', '/huong-dan-doc', '/nguyen-tac-bien-tap', '/quyen-su-dung', '/tinh-trang-tu-lieu', '/sitemap.xml']) await get(path);
  const blocked = await fetch(origin + '/api/action', { method: 'POST', body: 'action=bookmark' });
  check('Write API stays read-only', blocked.status === 405);

  const require = createRequire('C:/Users/LOQ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
  const { chromium } = require('playwright');
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-first-run', '--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const categories = ['dat-nam-bo', 'nep-xua', 'tieng-que-minh', 'loi-nguoi-xua', 'le-hoi', 'dau-xua'];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const path of ['/', ...categories.map(slug => '/chuyen-muc/' + slug), '/tinh-trang-tu-lieu']) {
      const response = await page.goto(origin + path, { waitUntil: 'networkidle' });
      check(`Browser ${width} ${path}`, response.status() === 200);
      await page.evaluate(() => document.fonts.ready);
      const bounds = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      check(`No overflow ${width} ${path}`, bounds.scroll <= bounds.width + 1);
      if (path.includes('chuyen-muc')) check(`Nonempty collection ${path}`, await page.locator('.nb-story-card').count() > 0);
      await page.screenshot({ path: fileURLToPath(new URL(`${path.replaceAll('/', '-') || 'home'}-${width}.png`, output)), fullPage: true });
    }
  }
  await page.goto(origin + '/chuyen-muc/le-hoi?topic=boat_racing', { waitUntil: 'networkidle' });
  check('Festival topic filter', await page.locator('.nb-story-card').count() === 1 && await page.getByRole('heading', { name: 'Đua ghe Ngo: nhịp chèo của cộng đồng' }).count() === 1);
  await page.goto(origin + '/chuyen-muc/tieng-que-minh?q=nghen', { waitUntil: 'networkidle' });
  check('New dictionary entry searchable', await page.locator('.nb-story-card').count() === 1);
  for (const id of ['NBS-TUCNGU-18', 'E027']) {
    const item = catalog.items.find(row => row.id === id);
    await page.goto(origin + '/ho-so/' + item.slug, { waitUntil: 'networkidle' });
    const images = await page.locator('.documentary-photo img').all();
    for (const image of images) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(img => img.decode());
      check(`Photo decoded ${id}`, await image.evaluate(img => img.naturalWidth > 0));
    }
    await page.screenshot({ path: fileURLToPath(new URL(`dossier-${id}-390.png`, output)), fullPage: true });
  }
  check('No browser runtime errors', errors.length === 0);
  await writeFile(new URL('results.json', output), JSON.stringify({ checkedAt: new Date().toISOString(), origin, productionWrites: false, stats: catalog.stats, readingJourneys: tours.length, passed: results.length, checks: results, browserErrors: errors }, null, 2));
  console.log(JSON.stringify({ passed: results.length, stats: catalog.stats, readingJourneys: tours.length, output: fileURLToPath(output) }));
} finally {
  await browser?.close();
  server.kill();
}
