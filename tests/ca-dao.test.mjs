import test from 'node:test';
import assert from 'node:assert/strict';
import { loadValidatedRelease } from '../scripts/validate-published-release.mjs';

const { release, counts } = await loadValidatedRelease('2026-11-04-ca-dao');
test('ca dao layer: four deep dossiers, each with variants or readings, open questions and sources', () => {
  assert.equal(counts.articles, 4);
  for (const a of release.articles) {
    assert.ok(a.body.split(/\s+/).length > 600, `${a.id} is too thin`);
    assert.ok(a.sections.some(s => s.kind === 'editorial_note' && /để ngỏ|Đọc cạnh nhau/.test(s.heading)), `${a.id} must say what is still unknown`);
    assert.ok(a.sections.some(s => /\n“/.test(s.text) || /^“/.test(s.text) || s.text.includes(':\n\n“')), `${a.id} must quote the verses`);
    assert.equal(a.answers.unknowns.state, 'unknown');
  }
  // Câu ca Cái Răng phải giữ đủ ba bản và mốc sau năm 1903.
  const cr = release.articles.find(a => a.id === 'NBS-CD-CAI-RANG');
  assert.match(cr.body, /cho nhơn, cho nghĩa/i); assert.match(cr.body, /Chớ đừng cho lúa gạo/); assert.match(cr.body, /1903/);
});
