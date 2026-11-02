// Tạo ảnh mờ siêu nhỏ (LQIP) và màu nền chủ đạo cho mọi ảnh trong public/media.
// Chạy lại mỗi khi thêm hoặc thay ảnh: `npm run media:placeholders`. Kết quả ghi vào lib/media-placeholders.json.
import { readdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const dir = new URL('../public/media/', import.meta.url);
const out = {};
for (const name of (await readdir(dir)).sort()) {
  if (!/\.(?:jpe?g|png|webp)$/i.test(name)) continue;
  const file = new URL(name, dir).pathname;
  const tiny = await sharp(file).resize(24, 24, { fit: 'inside' }).webp({ quality: 40 }).toBuffer();
  const { dominant } = await sharp(file).stats();
  const hex = '#' + [dominant.r, dominant.g, dominant.b].map(v => v.toString(16).padStart(2, '0')).join('');
  out[`/media/${name}`] = { blur: `data:image/webp;base64,${tiny.toString('base64')}`, color: hex };
}
await writeFile(new URL('../lib/media-placeholders.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(Object.keys(out).length, 'placeholders');
