import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

// Download original Commons files only; source and licence review live in the content bundle.
const files = [
  ['banh-pia-tonysam123.jpg', 'https://commons.wikimedia.org/wiki/File:Bánh_pía_new.jpg'],
  ['ghe-ngo-namhyhoangphong.jpg', 'https://commons.wikimedia.org/wiki/File:Ngo_junk_of_the_Khmer_people_(Tuk_ngo).jpg'],
  ['ninh-kieu-huynhloc.jpg', 'https://commons.wikimedia.org/wiki/File:Ben_Ninh_Kieu_(32514299085).jpg'],
  ['tuc-ngu-huynh-tinh-cua-trang-6.jpg', 'https://vi.wikisource.org/wiki/Trang:Tục_ngữ,_cổ_ngữ,_gia_ngôn.djvu/8'],
];
const headers = { 'User-Agent': 'NamBoKySu/1.0 (https://github.com/phucnguyendangbao-bot/Nam-b-k-s-)' };
const originals = new URL('../work/content-media/originals/', import.meta.url);
await mkdir(originals, { recursive: true });
for (const [filename, page] of files) {
  const path = filename.startsWith('tuc-ngu-') ? new URL(`../public/media/${filename}`, import.meta.url) : new URL(filename, originals);
  let existing = false;
  try { await access(path); existing = true; } catch { /* download missing asset */ }
  if (!existing) {
    const response = await fetch(page, { headers });
    if (!response.ok) throw new Error(`${page}: ${response.status}`);
    const html = await response.text();
    const match = filename.startsWith('tuc-ngu-')
      ? html.match(/href="([^"]+page8-[^"]+\.jpg[^"\s]*)"[^>]*[^]*?>Hình<\/a>/)
        ?? html.match(/(?:src|href)="([^"]+page8-[^"]+\.jpg[^"\s]*)"/)
      : html.match(/class="fullImage(?:Link)?"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"/);
    if (!match) throw new Error(`Original image link missing: ${page}`);
    const url = new URL(match[1].replaceAll('&amp;', '&'), page).href;
    const binary = await fetch(url, { headers });
    if (!binary.ok) throw new Error(`${url}: ${binary.status}`);
    if (!binary.headers.get('content-type')?.startsWith('image/')) throw new Error(`Not an image: ${url}`);
    await writeFile(path, new Uint8Array(await binary.arrayBuffer()));
  }
  const bytes = await readFile(path);
  console.log(JSON.stringify({ filename, page, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }));
  if (!filename.startsWith('tuc-ngu-')) {
    const optimized = await sharp(bytes).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
    const optimizedName = filename.replace(/\.jpg$/, '.webp');
    await writeFile(new URL(`../public/media/${optimizedName}`, import.meta.url), optimized);
    const dimensions = await sharp(optimized).metadata();
    console.log(JSON.stringify({ filename: optimizedName, bytes: optimized.length, width: dimensions.width, height: dimensions.height, sha256: createHash('sha256').update(optimized).digest('hex') }));
  }
}
