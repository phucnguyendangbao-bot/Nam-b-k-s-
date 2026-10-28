import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { knowledgeDomains, knowledgePages } from '../lib/knowledge-taxonomy.ts';

const origin = 'http://127.0.0.1:3018';
const output = new URL('../outputs/knowledge-qa/', import.meta.url);
await mkdir(output, { recursive: true });
const results = [], errors = []; let logs = '', browser;
const check = (label, condition) => { assert.ok(condition, label); results.push(label); };
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3018', '-H', '127.0.0.1'], { cwd: fileURLToPath(new URL('..', import.meta.url)), env: { ...process.env, NEXT_PUBLIC_SITE_URL: origin }, windowsHide: true });
server.stdout.on('data', data => logs += data); server.stderr.on('data', data => logs += data);
try {
  const deadline = Date.now() + 30000;
  while (!logs.includes('Ready in')) {
    if (server.exitCode !== null || Date.now() > deadline) throw new Error(logs);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  const get = async path => { const response = await fetch(origin + path, { signal: AbortSignal.timeout(20000) }); const text = await response.text(); check(`HTTP 200 ${path}`, response.status === 200); check(`Unicode ${path}`, !text.includes('\uFFFD')); return text; };
  const knowledge = JSON.parse(await get('/api/knowledge'));
  check('Only 25 published records in knowledge API', knowledge.count === 25 && knowledge.items.every(item => item.status === 'published'));
  check('12 domains and six events', knowledge.domains.length === 12 && knowledge.events.length === 6);
  const privateIds = ['E006', 'E007', 'KN-SAMPLE-DOC-CHUA', 'KN-SAMPLE-NGUYEN-TIEU', 'KN-SAMPLE-CHAU-GIANG'];
  const index = JSON.parse(await get('/api/search'));
  const sitemap = await get('/sitemap.xml');
  const publicPayload = JSON.stringify({ knowledge, index, sitemap });
  check('Drafts absent from API, search and sitemap', privateIds.every(id => !publicPayload.includes(id)));
  check('Search includes historical names and sourced aliases', index.entries.some(entry => entry.href.includes('/ho-so/') && entry.hay.includes('cong vien ninh kieu')) && index.entries.some(entry => entry.href.includes('/ho-so/') && entry.hay.includes('sai gon')));
  const catalog = JSON.parse(await get('/api/catalog'));
  check('Existing publication counters unchanged', catalog.items.length === 25 && catalog.stats.pending === 23 && catalog.stats.sources === 45);
  const basePages = ['/', ...knowledgePages.map(page => '/' + page.slug), ...knowledgeDomains.map(domain => '/chuyen-de/' + domain.id), ...['dat-nam-bo', 'nep-xua', 'tieng-que-minh', 'loi-nguoi-xua', 'le-hoi', 'dau-xua'].map(slug => '/chuyen-muc/' + slug)];
  for (const path of basePages) await get(path);
  for (const item of catalog.items) { const html = await get('/ho-so/' + item.slug); check(`Seven-question panel ${item.id}`, html.includes('id="ho-so-tri-thuc"') && html.includes('Điều gì chưa được xác minh?')); }
  for (const path of ['/ban-do', '/hanh-trinh/ven-song-can-tho-tu-pho-cho-den-cho-noi', '/hanh-trinh/lang-co-long-tuyen-ben-rach-binh-thuy']) { const html = await get(path); check(`Existing atlas/tour ${path}`, html.includes('3D') || html.includes('TourPlayer')); }
  const filtered = JSON.parse(await get('/api/knowledge?domain=le-hoi&community=khmer'));
  check('Intersecting domain/community filters', filtered.count === 4);
  check('Historical accentless query', JSON.parse(await get('/api/knowledge?q=sai%20gon')).items.some(item => item.id === 'NBS-TUCNGU-18'));
  const invalid = await fetch(origin + '/chuyen-de/invalid');
  const invalidHTML = await invalid.text();
  await writeFile(new URL('invalid-domain.html', output), invalidHTML);
  check('Invalid domain renders not-found', invalid.status === 404 || invalidHTML.includes('Trang này trôi đâu mất rồi.'));
  const require = createRequire('C:/Users/LOQ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
  const { chromium } = require('playwright');
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-first-run', '--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const path of basePages) {
      await page.goto(origin + path, { waitUntil: 'networkidle' });
      check(`No horizontal overflow ${width} ${path}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      check(`Single main heading ${width} ${path}`, await page.locator('h1').count() === 1);
    }
    await page.goto(origin + '/tri-thuc', { waitUntil: 'networkidle' });
    await page.screenshot({ path: fileURLToPath(new URL(`hub-${width}.png`, output)), fullPage: true });
    await page.screenshot({ path: fileURLToPath(new URL(`hub-viewport-${width}.png`, output)) });
    await page.locator('input[name=q]').fill('ca rang');
    await page.getByRole('button', { name: 'Tra cứu', exact: true }).click();
    await page.waitForURL('**/tri-thuc?q=ca+rang**');
    check(`Accentless form works ${width}`, (await page.locator('main').innerText()).includes('Cái Răng'));
    await page.goto(origin + '/tri-thuc?domain=le-hoi&community=khmer', { waitUntil: 'networkidle' });
    check(`GET filters preserve selection ${width}`, await page.locator('select[name=community]').inputValue() === 'khmer' && (await page.locator('.kn-result').innerText()).startsWith('4 '));
    await page.goto(origin + '/tu-dien?q=man', { waitUntil: 'networkidle' });
    check(`Dictionary query ${width}`, await page.getByRole('link', { name: /mần/, exact: false }).count() > 0);
    await page.goto(origin + '/lien-ket-tri-thuc', { waitUntil: 'networkidle' });
    const first = page.locator('.kn-graph li a.text-link').first(); const href = await first.getAttribute('href');
    await first.click(); await page.waitForURL('**' + href);
    check(`Recenter knowledge graph ${width}`, await page.locator('select[name=id]').inputValue() === new URLSearchParams(href.split('?')[1]).get('id'));
    check(`Central card text has light contrast ${width}`, await page.locator('.kn-center h2 a').evaluate(element => getComputedStyle(element).color) === 'rgb(255, 249, 237)' && await page.locator('.kn-center>p').last().evaluate(element => getComputedStyle(element).color) === 'rgb(255, 249, 237)');
    await page.screenshot({ path: fileURLToPath(new URL(`links-${width}.png`, output)), fullPage: true });
    const article = knowledge.items.find(item => item.id === 'E021');
    await page.goto(origin + '/ho-so/' + article.slug, { waitUntil: 'networkidle' });
    await page.locator('.kn-context>summary').click();
    check(`Hypothesis and historical-place labels ${width}`, (await page.locator('.kn-context').innerText()).includes('từ khóa của giả thuyết') && (await page.locator('.kn-context').innerText()).includes('hiện hành: chưa đối chiếu'));
    check(`Expanded dossier no overflow ${width}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: fileURLToPath(new URL(`dossier-${width}.png`, output)), fullPage: true });
  }
  await page.goto(origin + '/ong-ba-ke-chuyen', { waitUntil: 'networkidle' });
  await page.locator('[name=title]').fill('Bản kiểm thử kỹ thuật'); await page.locator('[name=text]').fill('Đây là dữ liệu kiểm thử, không phải ký ức lịch sử.'); await page.locator('[name=provenance]').fill('Tệp thử tạo bởi kiểm thử tự động.'); await page.locator('[name=storage]').check();
  const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Tải bản nháp JSON' }).click();
  const download = await downloadPromise; const draft = JSON.parse(await readFile(await download.path(), 'utf8'));
  check('Memory export remains local draft and requires separate publication approval', draft.status === 'draft' && draft.verification === 'unverified' && draft.publish_approval === false && draft.publication_consent === false && draft.recorded_date === null);
  check('No runtime page errors', errors.length === 0);
  await writeFile(new URL('results.json', output), JSON.stringify({ status: 'passed', checks: results.length, results, errors }, null, 2));
  console.log(`PASS: ${results.length} checks; desktop 1440px / mobile 390px; screenshots in outputs/knowledge-qa.`);
} finally {
  if (browser) await browser.close(); server.kill(); await writeFile(new URL('server.log', output), logs);
}
