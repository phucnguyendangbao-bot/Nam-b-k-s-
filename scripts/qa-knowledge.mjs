import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { knowledgeDomains, knowledgePages } from '../lib/knowledge-taxonomy.ts';
import { loadInputs, createLedger } from './research-data.mjs';

const inputs = await loadInputs();
const ledger = createLedger(inputs);
const approvedIds = new Set(ledger.items.filter(item => item.publication_status === 'published').map(item => item.id));
const privateIds = ledger.items.filter(item => item.publication_status === 'draft').map(item => item.id);
const releaseIds = new Set(inputs.release.articles.map(article => article.id));
const articlesById = new Map([...inputs.bundle.articles, ...inputs.expansion.articles].map(article => [article.id, article]));

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
  check('Knowledge API contains exactly the approved records', knowledge.count === approvedIds.size && knowledge.items.every(item => item.status === 'published' && approvedIds.has(item.id)) && new Set(knowledge.items.map(item => item.id)).size === approvedIds.size);
  check('12 domains and existing source-checked events remain available', knowledge.domains.length === 12 && knowledge.events.length >= 6 && knowledge.events.some(event => event.id === 'EV-1897-BOOK'));
  check('Seven reviewed release records are public', releaseIds.size === 7 && [...releaseIds].every(id => knowledge.items.some(item => item.id === id)));
  check('All twelve domains have a public profile', knowledgeDomains.every(domain => knowledge.items.some(item => [item.knowledge.primary_domain, ...item.knowledge.secondary_domains].includes(domain.id))));
  const index = JSON.parse(await get('/api/search'));
  const sitemap = await get('/sitemap.xml');
  const publicPayload = JSON.stringify({ knowledge, index, sitemap });
  check('All remaining drafts absent from public API, search and sitemap', privateIds.length === ledger.counts.draft && privateIds.every(id => !publicPayload.includes(id)));
  check('Unverified funeral records remain private', ['E006', 'E007'].every(id => privateIds.includes(id)));
  check('Search includes historical names and sourced aliases', index.entries.some(entry => entry.href.includes('/ho-so/') && entry.hay.includes('cong vien ninh kieu')) && index.entries.some(entry => entry.href.includes('/ho-so/') && entry.hay.includes('sai gon')));
  const catalog = JSON.parse(await get('/api/catalog'));
  check('Catalog counters match the independently validated release ledger', catalog.items.length === ledger.counts.published && catalog.stats.pending === ledger.counts.draft && catalog.stats.total === ledger.counts.tracked && catalog.stats.sources === ledger.counts.registered_sources && catalog.stats.verified === ledger.counts.article_source_checked && catalog.stats.eligible === ledger.counts.publication_eligible);
  check('Only approved records enter the catalog', catalog.items.every(item => approvedIds.has(item.id)) && new Set(catalog.items.map(item => item.id)).size === approvedIds.size);
  const basePages = ['/', ...knowledgePages.map(page => '/' + page.slug), ...knowledgeDomains.map(domain => '/chuyen-de/' + domain.id), ...['dat-nam-bo', 'nep-xua', 'tieng-que-minh', 'loi-nguoi-xua', 'le-hoi', 'dau-xua'].map(slug => '/chuyen-muc/' + slug)];
  for (const path of basePages) await get(path);
  for (const item of catalog.items) { const html = await get('/ho-so/' + item.slug); check(`Seven-question panel ${item.id}`, html.includes('id="ho-so-tri-thuc"') && html.includes('Điều gì chưa được xác minh?')); check(`Source locators and versions ${item.id}`, html.includes('Vị trí đối chiếu:') && html.includes('Phiên bản:')); }
  const readingTours = index.entries.filter(entry => entry.type === 'tour');
  check('Reviewed reading journeys remain searchable', readingTours.length === inputs.bundle.tours.length + inputs.expansion.tours.length);
  for (const tour of readingTours) await get(tour.href);
  for (const path of ['/ban-do', '/hanh-trinh/ven-song-can-tho-tu-pho-cho-den-cho-noi', '/hanh-trinh/lang-co-long-tuyen-ben-rach-binh-thuy']) { const html = await get(path); check(`Existing atlas/tour ${path}`, html.includes('3D') || html.includes('TourPlayer')); }
  const filtered = JSON.parse(await get('/api/knowledge?domain=le-hoi&community=khmer'));
  check('Intersecting domain/community filters', filtered.count === 4);
  check('Historical accentless query', JSON.parse(await get('/api/knowledge?q=sai%20gon')).items.some(item => item.id === 'NBS-TUCNGU-18'));
  const invalid = await fetch(origin + '/chuyen-de/invalid');
  const invalidHTML = await invalid.text();
  await writeFile(new URL('invalid-domain.html', output), invalidHTML);
  check('Invalid domain renders not-found', invalid.status === 404 || invalidHTML.includes('Trang này trôi đâu mất rồi.'));
  check('Write API remains read-only', (await fetch(origin + '/api/action', { method: 'POST', body: 'action=bookmark' })).status === 405);
  const require = createRequire('C:/Users/LOQ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
  const { chromium } = require('playwright');
  browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-first-run'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const browserPaths = [...basePages, ...catalog.items.map(item => '/ho-so/' + item.slug), ...readingTours.map(tour => tour.href)];
    for (const path of browserPaths) {
      await page.goto(origin + path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      check(`No horizontal overflow ${width} ${path}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      check(`Single main heading ${width} ${path}`, await page.locator('h1').count() === 1);
      const item = catalog.items.find(item => path === '/ho-so/' + item.slug);
      if (item) {
        const original = articlesById.get(item.id);
        if (releaseIds.has(item.id)) {
          await page.locator('.kn-context>summary').click();
          check(`Seven structured answers displayed ${width} ${item.id}`, await page.locator('.kn-context dl dt').count() === 7 && await page.locator('.kn-answer-state').count() === 7);
          check(`Unknowns disclosed ${width} ${item.id}`, (await page.locator('.kn-context').innerText()).includes('Điều gì chưa được xác minh?'));
          check(`Expanded release dossier fits ${width} ${item.id}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        }
        if (original?.kind === 'dialect') {
          check(`No synthetic pronunciation substituted ${width} ${item.id}`, await page.locator('.audio-field audio').count() === 0 && (await page.locator('.audio-field').innerText()).includes('Chưa có bản ghi phát âm được cấp quyền'));
        }
        const images = await page.locator('.documentary-photo img').all();
        for (const [imageIndex, image] of images.entries()) {
          await image.scrollIntoViewIfNeeded(); await image.evaluate(element => element.decode());
          check(`Licensed image decodes ${width} ${item.id} ${imageIndex}`, await image.evaluate(element => element.naturalWidth > 0 && element.naturalHeight > 0));
          const figure = image.locator('..');
          check(`Image attribution and license are visible ${width} ${item.id} ${imageIndex}`, await figure.locator('figcaption a[href]').count() >= 2 && (await figure.locator('figcaption').innerText()).toLocaleLowerCase('vi').includes('thay đổi ảnh'));
        }
      }
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
    await page.waitForLoadState('networkidle'); await page.evaluate(() => document.fonts.ready);
    check(`Recenter knowledge graph ${width}`, await page.locator('select[name=id]').inputValue() === new URLSearchParams(href.split('?')[1]).get('id'));
    check(`Central card text has light contrast ${width}`, await page.locator('.kn-center h2 a').evaluate(element => getComputedStyle(element).color) === 'rgb(255, 249, 237)' && await page.locator('.kn-center>p').last().evaluate(element => getComputedStyle(element).color) === 'rgb(255, 249, 237)');
    await page.locator('.kn-center').scrollIntoViewIfNeeded();
    await page.screenshot({ path: fileURLToPath(new URL(`links-${width}.png`, output)) });
    const article = knowledge.items.find(item => item.id === 'E021');
    await page.goto(origin + '/ho-so/' + article.slug, { waitUntil: 'networkidle' });
    await page.locator('.kn-context>summary').click();
    check(`Hypothesis and historical-place labels ${width}`, (await page.locator('.kn-context').innerText()).includes('từ khóa của giả thuyết') && (await page.locator('.kn-context').innerText()).includes('hiện hành: chưa đối chiếu'));
    check(`Expanded dossier no overflow ${width}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.evaluate(() => document.fonts.ready); await page.locator('.kn-context').scrollIntoViewIfNeeded();
    await page.screenshot({ path: fileURLToPath(new URL(`dossier-${width}.png`, output)) });
  }
  await page.goto(origin + '/ong-ba-ke-chuyen', { waitUntil: 'networkidle' });
  await page.locator('[name=title]').fill('Bản kiểm thử kỹ thuật'); await page.locator('[name=text]').fill('Đây là dữ liệu kiểm thử, không phải ký ức lịch sử.'); await page.locator('[name=provenance]').fill('Tệp thử tạo bởi kiểm thử tự động.'); await page.locator('[name=storage]').check();
  const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Tải bản nháp JSON' }).click();
  const download = await downloadPromise; const draft = JSON.parse(await readFile(await download.path(), 'utf8'));
  check('Memory export remains local draft and requires separate publication approval', draft.status === 'draft' && draft.verification === 'unverified' && draft.publish_approval === false && draft.publication_consent === false && draft.recorded_date === null);
  check('No runtime page errors', errors.length === 0);
  await writeFile(new URL('results.json', output), JSON.stringify({ status: 'passed', release_version: inputs.release.version, public_records: approvedIds.size, remaining_drafts: privateIds.length, sources: ledger.counts.registered_sources, checks: results.length, results, errors }, null, 2));
  console.log(`PASS: ${results.length} checks; desktop 1440px / mobile 390px; screenshots in outputs/knowledge-qa.`);
} finally {
  if (browser) await browser.close(); server.kill(); await writeFile(new URL('server.log', output), logs);
}
