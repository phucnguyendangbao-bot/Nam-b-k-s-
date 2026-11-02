import test from 'node:test';
import assert from 'node:assert/strict';
import { loadValidatedRelease, validatePublishedRelease } from '../scripts/validate-published-release.mjs';

const prior = await loadValidatedRelease('2026-11-01-supplement');
const current = await loadValidatedRelease('2026-11-02-enrichment');
const dossiers = prior.release.articles.filter(article => article.kind === 'article');

test('enrichment deepens the same eleven dossiers without duplicating routes or inherited assets', () => {
  assert.deepEqual(current.release.articles.map(article => article.id), dossiers.map(article => article.id));
  for (const before of dossiers) {
    const after = current.release.articles.find(article => article.id === before.id);
    assert.equal(after.slug, before.slug);
    assert.equal(after.chapter, before.chapter);
    assert.deepEqual(after.media, before.media);
    assert.deepEqual(after.sections.slice(0, 2), before.sections.slice(0, 2));
    assert.ok(after.body.split(/\s+/u).length > before.body.split(/\s+/u).length * 2, after.id);
  }
  assert.deepEqual(current.release.tours, []);
  assert.deepEqual(current.release.events, []);
  assert.deepEqual(current.release.locations, []);
  assert.deepEqual(current.approval.approved_dialect_ids, []);
});

test('new factual sections carry reviewed evidence and reading connections are marked as editorial', () => {
  for (const article of current.release.articles) {
    for (const section of article.sections.slice(2, 4)) {
      assert.equal(section.kind, 'documented_history');
      assert.ok(section.sourceIds.every(id => article.claims.some(claim => claim.source_id === id && claim.locator)));
    }
    assert.equal(article.sections[4].kind, 'editorial_note');
    assert.ok(article.knowledge.secondary_domains.length);
    assert.ok(article.answers.when_where.state !== 'unknown');
    assert.ok(article.answers.related.state !== 'unknown');
    assert.ok(article.answers.community.text !== 'Chưa đủ tư liệu để kết luận riêng trong phạm vi nguồn đã đọc.');
  }
  const altered = structuredClone(current.release);
  altered.articles[0].sections[2].sourceIds = ['UNREAD-SOURCE'];
  assert.throws(() => validatePublishedRelease(altered, current.approval, current.context), /Not approved/);
});

test('date disagreements and source access limits remain explicit rather than silently resolved', () => {
  const get = id => current.release.articles.find(article => article.id === id);
  assert.match(get('NBS-CHUA-DOI-MAHATUP').scope_note, /2010.*2009/u);
  assert.match(get('NBS-VAN-THANH-MIEU-VL').scope_note, /bia số 1.*khác nhau/u);
  assert.match(get('NBS-DA-CO-HOAI-LANG').scope_note, /1918.*1919.*1920/u);
  assert.equal(get('NBS-CHO-NOI-NGA-BAY').answers.changes.state, 'unknown');
  assert.equal(get('NBS-GIA-DINH-THONG-CHI').answers.changes.state, 'unknown');
  assert.match(get('NBS-U-MINH-THUONG').body, /30\/04\/2015/u);
  for (const id of ['NB-UMINH-RSIS-2228', 'NB-BACHUAXU-UNESCO-2024']) {
    const source = current.release.sources.find(source => source.id === id);
    assert.match(source.source_version, /01\/11\/2026.*02\/11\/2026/u);
  }
  for (const id of ['NBS-OC-EO-BA-THE', 'NBS-GACH-GOM-MANG-THIT', 'NBS-VIA-BA-CHUA-XU']) {
    const article = get(id);
    assert.ok(Object.values(article.answers).some(answer => answer.state === 'unknown'));
  }
});
