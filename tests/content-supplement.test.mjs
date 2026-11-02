import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadValidatedRelease, validatePublishedRelease } from '../scripts/validate-published-release.mjs';
import { chapters, storyPosition } from '../lib/story.ts';

const data = await loadValidatedRelease('2026-11-01-supplement');
const check = release => validatePublishedRelease(release, data.approval, data.context);

test('supplement integrates new dossiers, citations, reading journeys and every chapter exactly once', () => {
  assert.equal(data.counts.articles, 13);
  assert.equal(data.counts.reading_journeys, 2);
  const ids = chapters.flatMap(chapter => chapter.ids);
  const slugs = data.release.articles.map(article => article.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const article of data.release.articles) {
    assert.equal(ids.filter(id => id === article.id).length, 1);
    assert.equal(storyPosition(article.id).chapter.slug, article.chapter);
    assert.ok(article.scope_note && article.sections.every(section => section.sourceIds.length));
  }
  assert.ok(data.release.tours[0].content_ids.includes('NBS-NHA-CO-CAI-CUONG'));
  assert.ok(data.release.tours[1].content_ids.includes('NBS-KENH-VINH-TE'));
  const broken = structuredClone(data.release);
  broken.tours[0].content_ids.push('UNREVIEWED-DRAFT');
  assert.throws(() => check(broken), /unapproved stop/);
});

test('new dialect entries need separate named clearance, editorial examples and no fabricated audio', () => {
  const word = data.release.articles.find(article => article.id === 'NBS-TD-LI-XI');
  assert.ok(word.dialect.example_note.includes('ban biên soạn'));
  for (const mutate of [
    article => delete article.dialect_clearance,
    article => article.dialect_clearance.example_origin = 'collected',
    article => article.dialect.audio_asset_id = 'invented.wav',
    article => article.dialect_clearance.source_ids = ['UNREAD-DICTIONARY'],
    article => article.dialect.meaning = 'Unreviewed replacement meaning',
  ]) {
    const altered = structuredClone(data.release);
    mutate(altered.articles.find(article => article.id === word.id));
    assert.throws(() => check(altered));
  }
});

test('historical and register dates stay distinct and correction uses the Ramsar register', () => {
  assert.equal(data.release.events.find(event => event.id === 'SUP-UMINH-2015').value, '2015-04-30');
  assert.equal(data.release.events.find(event => event.id === 'SUP-GDTTC-1820').kind, 'publication');
  assert.equal(data.release.events.find(event => event.id === 'SUP-CHUADOI-1569').kind, 'observed_event');
  assert.equal(data.release.events.find(event => event.id === 'SUP-CHUADOI-1999').kind, 'register');
  const altered = structuredClone(data.release);
  altered.events[0].source_id = 'UNREAD-SOURCE';
  assert.throws(() => check(altered), /no reviewed dossier/);
});

test('nine spec pins cannot silently become reviewed coordinates or point to missing dossiers', () => {
  assert.equal(data.release.locations.length, 9);
  assert.ok(data.release.locations.every(location => location.status === 'proposed'));
  for (const mutate of [p => p.status = 'reviewed', p => p.lat = 91, p => p.content_id = 'DRAFT', p => p.provenance = '']) {
    const altered = structuredClone(data.release);
    mutate(altered.locations[0]);
    assert.throws(() => check(altered));
  }
});

test('unverified dictionary leads remain drafts and are absent from public releases and chapters', async () => {
  const pending = JSON.parse(await readFile(new URL('../data/release/content-spec-pending-2026-11-01.json', import.meta.url), 'utf8'));
  assert.equal(pending.publication_status, 'draft');
  assert.equal(pending.publish_approval, false);
  assert.equal(pending.words.length, 3);
  for (const word of pending.words) {
    assert.ok(word.gap);
    assert.ok(!data.approval.approved_article_ids.includes(word.id));
    assert.ok(!chapters.some(chapter => chapter.ids.includes(word.id)));
  }
});
