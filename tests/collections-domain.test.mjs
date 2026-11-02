import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nfc,parseSections,permitsCommercialMedia,imagePathAllowed,audioPathAllowed} from '../lib/editorial-model.ts';
const bundle=JSON.parse(readFileSync(new URL('../lib/editorial-bundle.json',import.meta.url),'utf8'));
test('Vietnamese NFC prevents decomposed fallback marks and preserves text',()=>{
 for(const title of ['Đất Nam Bộ','Nếp xưa','Tiếng quê mình','Đầu Sấu','nhà cổ Bình Thủy'])assert.equal(nfc(title.normalize('NFD')),title);
});
test('prepared content never carries publication permission',()=>{
 assert.equal(bundle.articles.length,11);assert.ok(bundle.articles.every(a=>a.publish===false));
 for(const id of ['E006','E007'])assert.ok(!bundle.articles.some(a=>a.id===id));
});

test('release bundle includes every cited source and reviewed locator',()=>{
 for(const a of bundle.articles)for(const c of a.claims){
  const source=bundle.sources.find(s=>s.id===c.source_id);
  assert.ok(source,`Missing ${c.source_id} in ${a.id}`);assert.match(source.url,/^https:\/\//);
  assert.ok(c.locator&&c.statement&&source.source_version);
 }
});
test('licensed media has authorship, source, license and modification history',()=>{
 for(const a of bundle.articles)for(const m of a.media){assert.ok(m.author);assert.match(m.source_url,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);assert.ok(m.modifications);assert.equal(m.commercial_allowed,1);assert.ok(permitsCommercialMedia(m.license_name,m.license_url));assert.ok(imagePathAllowed(m.url));}
 for(const url of ['https://creativecommons.org/licenses/by-nc/4.0/','https://creativecommons.org/licenses/by-nd/4.0/','https://example.com'])assert.equal(permitsCommercialMedia('CC',url),false);
});
test('dictionary entries preserve license and distinguish authored examples from recordings',()=>{
 const words=bundle.articles.filter(a=>a.kind==='dialect');assert.equal(words.length,5);
 for(const a of words){assert.equal(a.dialect.audio_asset_id,null);assert.match(a.dialect.example_note,/không phải ca dao/);assert.equal(a.text_license_url,'https://creativecommons.org/licenses/by-sa/4.0/');assert.ok(a.claims[0].locator);}
});
test('article sections reject malformed payloads and categorize uncertainty explicitly',()=>{
 assert.deepEqual(parseSections('not-json'),[]);assert.deepEqual(parseSections('{}'),[]);
 const dau=bundle.articles.find(a=>a.id==='E020');assert.ok(dau.sections.some(s=>s.kind==='hypothesis'));assert.ok(dau.sections.some(s=>s.kind==='folk_belief'));
 const wedding=bundle.articles.find(a=>a.id==='E001');assert.ok(wedding.sections.some(s=>s.kind==='observed_practice'));assert.ok(wedding.sections.some(s=>s.kind==='folk_belief'));
});
test('asset paths cannot escape vetted media folder',()=>{
 assert.equal(imagePathAllowed('/media/../private/photo.jpg'),false);assert.equal(audioPathAllowed('javascript:alert(1)'),false);assert.equal(audioPathAllowed('/media/voice.ogg'),true);
});

test('câu chuyện sáu chương: phủ đủ hồ sơ, không trùng, ảnh chương đủ quyền và đúng tệp', async () => {
  const { chapters, storyImages, storyImageCleared, storyPosition } = await import('../lib/story.ts');
  const { createHash } = await import('node:crypto');
  const { readFile } = await import('node:fs/promises');
  const ids = chapters.flatMap(c => c.ids);
  assert.equal(new Set(ids).size, ids.length, 'mỗi hồ sơ chỉ thuộc một chương');
  assert.deepEqual(chapters.map(c => c.n), [1, 2, 3, 4, 5, 6]);
  for (const img of Object.values(storyImages)) {
    assert.ok(storyImageCleared(img), img.url);
    const bytes = await readFile(new URL('../public' + img.url, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), img.sha256, img.url);
  }
  const first = storyPosition(ids[0]), last = storyPosition(ids.at(-1));
  assert.equal(first.prev, null); assert.equal(last.next, null);
  for (let index = 0; index < chapters.length - 1; index++) {
    assert.equal(storyPosition(chapters[index].ids.at(-1)).next.id, chapters[index + 1].ids[0], 'cuối mỗi chương sang đầu chương tiếp');
  }
});

test('mọi ảnh trong public/media có ảnh mờ dựng sẵn và màu nền, để khung ảnh không trắng trơn khi đang tải', async () => {
  const { readdir, readFile } = await import('node:fs/promises');
  const placeholders = JSON.parse(await readFile(new URL('../lib/media-placeholders.json', import.meta.url), 'utf8'));
  const files = (await readdir(new URL('../public/media/', import.meta.url))).filter(name => /\.(?:jpe?g|png|webp)$/i.test(name));
  for (const name of files) {
    const p = placeholders[`/media/${name}`];
    assert.ok(p, `thiếu ảnh mờ cho ${name}: chạy npm run media:placeholders`);
    assert.match(p.blur, /^data:image\/webp;base64,/); assert.ok(p.blur.length < 1200, name);
    assert.match(p.color, /^#[0-9a-f]{6}$/);
  }
});
