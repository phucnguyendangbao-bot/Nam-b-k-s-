import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { interleave, markText, milestones, paragraphs } from '../lib/narrative.ts';

const dir = new URL('../data/release/', import.meta.url);
const articles = new Map();
for (const f of fs.readdirSync(dir).filter(f => f.startsWith('published-')).sort())
  for (const a of JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8')).articles) articles.set(a.id, a);
const sections = id => articles.get(id).sections.map(s => ({ heading: s.heading, text: s.text, kind: s.kind }));

test('lớp kể chuyện không đổi một chữ nào của lời văn', () => {
  for (const a of articles.values()) for (const s of a.sections ?? []) {
    assert.equal(markText(s.text).map(m => m.text).join(''), s.text);
    assert.equal(paragraphs(s.text).join('\n\n').replace(/\s+/g, ' '), s.text.trim().replace(/\s+/g, ' '));
  }
});

test('mốc thời gian là câu trích nguyên văn, dẫn đúng mục, xếp theo năm', () => {
  for (const a of articles.values()) {
    const list = sections(a.id), ms = milestones(list);
    assert.ok(ms.length === 0 || (ms.length >= 3 && ms.length <= 10), a.id);
    ms.forEach((m, i) => {
      if (i) assert.ok(ms[i - 1].year < m.year);
      const text = list[m.section].text.replace(/\s+/g, ' ');
      for (const piece of m.quote.split(' … ').map(x => x.replace(/^… |\s…$/g, '')))
        assert.ok(text.includes(piece), `${a.id} ${m.year}: câu trích không có trong mục`);
      assert.ok(m.quote.includes(String(m.year)), `${a.id} ${m.year}: câu trích không chứa năm`);
    });
  }
});

test('năm xuất bản của nguồn không thành mốc thời gian', () => {
  const ms = milestones([
    { heading: 'a', kind: 'documented_history', text: 'Báo Văn Hóa (2023) viết đình lập năm 1844. VOV 2019 ghi trùng tu năm 1853.' },
    { heading: 'b', kind: 'documented_history', text: 'Đình được xếp hạng năm 1989.' },
  ]);
  assert.deepEqual(ms.map(m => m.year), [1844, 1853, 1989]);
});

test('Đình Bình Thủy có dòng thời gian bắt đầu từ 1844', () => {
  const ms = milestones(sections('NBS-DINH-BINH-THUY'));
  assert.equal(ms[0].year, 1844);
  assert.ok(ms.some(m => m.year === 1852) && ms.some(m => m.year === 1853));
});

test('ảnh xen giữa các mục rải đều và không rơi ra ngoài bài', () => {
  assert.deepEqual([...interleave(8, 1)], [[3, [0]]]);
  assert.deepEqual([...interleave(8, 2).keys()], [2, 4]);
  for (let n = 1; n < 12; n++) for (let k = 0; k < 5; k++) {
    const slots = interleave(n, k);
    assert.equal([...slots.values()].flat().length, k);
    for (const at of slots.keys()) assert.ok(at >= 0 && at < Math.max(1, n - 1));
  }
});
