import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { loadValidatedRelease, validatePublishedRelease } from '../scripts/validate-published-release.mjs';
import { canReleaseArticle } from '../lib/release-model.ts';

const data = await loadValidatedRelease();
const check = (release = data.release, approval = data.approval, context = data.context) => validatePublishedRelease(release, approval, context);
test('seven named reviewed dossiers and three reading journeys pass a file and payload bound approval', () => {
  assert.equal(check().articles,7); assert.equal(check().claims,21); assert.equal(check().assets,3); assert.equal(check().reading_journeys,3);
  assert.equal(createHash('sha256').update(JSON.stringify(data.release)).digest('hex'),data.approval.release_payload_sha256);
  assert.deepEqual(data.release.articles.map(article=>article.id).sort(), [...data.approval.approved_article_ids].sort());
});
test('research labels and copied publication flags cannot publish an unnamed record', () => {
  const article=structuredClone(data.release.articles[0]);article.id='E006';
  assert.equal(canReleaseArticle(article,data.approval,new Set(data.release.sources.map(source=>source.id))),false);
  const release=structuredClone(data.release);release.articles.push(article);assert.throws(()=>check(release));
  const approval=structuredClone(data.approval);approval.status='pending';assert.throws(()=>check(data.release,approval));
});
test('registered library identifiers cannot substitute for a source read for this release', () => {
  const release=structuredClone(data.release);release.sources=[];release.articles[0].claims[0].source_id='S08';assert.throws(()=>check(release));
  const spoof=structuredClone(data.release);spoof.sources[0].id='S08';spoof.sources[0].source_type='official_article';
  assert.throws(()=>check(spoof));
});
test('bibliographic sources and an unreviewed source object are rejected', () => {
  for(const mutation of [s=>s.source_type='library_catalog',s=>s.review_status='pending',s=>s.checked_at='2020-01-01',s=>s.consulted_extent='index_only']) {
    const release=structuredClone(data.release);mutation(release.sources[0]);assert.throws(()=>check(release));
  }
});
test('existing registry URLs and source types cannot be silently replaced', () => {
  const release=structuredClone(data.release);release.sources.find(source=>source.id==='S07').url='https://example.invalid/other';assert.throws(()=>check(release));
});
test('body text, aliases and historical names cannot gain unsupported facts', () => {
  for(const mutation of [a=>a.body+='\nInvented event',a=>a.introduction='Unreviewed introduction',a=>a.knowledge.aliases.push({value:'Invented',kind:'historical_name',source_id:'MISSING',locator:''}),a=>a.knowledge.historical_places.push({name:'Invented',role:'area_as_recorded',source_id:'MISSING',locator:'',as_of:''}),a=>a.knowledge.origin_section=999]) {
    const release=structuredClone(data.release);mutation(release.articles[0]);assert.throws(()=>check(release));
  }
});
test('new audio, coordinates, unsupported answers and rights-pending media are blocked', () => {
  for(const mutation of [a=>a.audio_url='/media/fake.mp3',a=>a.latitude=10,a=>a.answers.what.source_ids=[],a=>a.claims[0].review_status='pending',a=>a.media[0].rights_review='pending',a=>a.media[0].license_url='https://example.invalid/license']) {
    const release=structuredClone(data.release);mutation(release.articles.find(article=>article.id==='E002'));assert.throws(()=>check(release));
  }
});
test('an image changed after clearance fails the byte hash check', () => {
  const context={...data.context,mediaBytes:new Map(data.context.mediaBytes)};
  context.mediaBytes.set(data.release.articles[0].media[0].url,new Uint8Array([1,2,3]));assert.throws(()=>check(data.release,data.approval,context));
});
test('register claims cannot be proven by an ordinary article alone', () => {
  const release=structuredClone(data.release);release.articles[0].claims[0].kind='register_entry';assert.throws(()=>check(release));
});
