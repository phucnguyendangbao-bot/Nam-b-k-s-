import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { canReleaseArticle, canReleaseDialect } from '../lib/release-model.ts';
import { editorialQuestions, factKindLabels, knowledgeDomains, knowledgeRegions, knowledgeCommunities } from '../lib/knowledge-taxonomy.ts';
import { imagePathAllowed, permitsCommercialMedia, sectionBody } from '../lib/editorial-model.ts';
import { contentExpansion } from '../lib/content-expansion.ts';
import { canChi, lunarOf } from '../lib/lunar.ts';

const root = new URL('../', import.meta.url);
const json = async file => JSON.parse(await readFile(new URL(file, root), 'utf8'));
const text = value => typeof value === 'string' && value.trim().length > 0;
const https = value => { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; } };
const unique = (values, label) => assert.equal(new Set(values).size, values.length, `Duplicate ${label}`);
export function validatePublishedRelease(release, approval, { sourceIds, sourceMap = new Map(), mediaBytes, knownArticleIds = new Set() }) {
  assert.equal(approval.status, 'approved'); assert.equal(approval.authority, 'owner_delegation');
  assert.ok(text(approval.authorization) && text(approval.reviewer) && /^\d{4}-\d{2}-\d{2}$/.test(approval.reviewed_at));
  unique(release.sources.map(source => source.id), 'release sources'); unique(release.articles.map(article => article.id), 'release articles'); unique(release.tours.map(tour => tour.id), 'release tours');
  assert.deepEqual([...approval.approved_article_ids].sort(), release.articles.map(article => article.id).sort(), 'Approval must name exactly this release');
  assert.deepEqual([...approval.approved_tour_ids].sort(), release.tours.map(tour => tour.id).sort());
  const sources = new Map(release.sources.map(source => [source.id, source]));
  const allSources = new Set(sources.keys());
  void sourceIds; // A registered ID alone is deliberately not evidence for this release.
  for (const source of release.sources) {
    assert.ok(https(source.url) && text(source.name) && text(source.source_type) && text(source.publisher) && text(source.source_version) && text(source.license_reported) && text(source.rights), `Incomplete source ${source.id}`);
    assert.ok(!['library_catalog','bibliographic_index','book_notice'].includes(source.source_type), 'Bibliography is not factual evidence');
    assert.equal(source.review_status, 'accepted'); assert.equal(source.checked_at, approval.reviewed_at);
    assert.ok(['full_article','transcription','abstract','register_entry','excerpt'].includes(source.consulted_extent), `Unknown consulted extent ${source.id}`);
    const registered = sourceMap.get(source.id);
    if (registered) { assert.equal(source.url, registered.url, `Existing source URL changed: ${source.id}`); assert.equal(source.source_type, registered.source_type, `Existing source type changed: ${source.id}`); }
  }
  const domains = new Set(knowledgeDomains.map(domain => domain.id)), regions = new Set(knowledgeRegions.map(region => region.id)), communities = new Set(knowledgeCommunities.map(community => community.id));
  let claims = 0, assets = 0;
  for (const article of release.articles) {
    assert.ok(canReleaseArticle(article, approval, allSources), `Not approved for publication: ${article.id}`);
    for (const key of ['title', 'summary', 'introduction', 'body', 'scope_note', 'historical_area', 'community', 'category', 'kind']) assert.ok(text(article[key]), `Missing ${key}: ${article.id}`);
    assert.equal(article.introduction, article.summary, 'Introduction needs the same reviewed text as summary');
    assert.equal(article.body, sectionBody(article.sections), 'Body must be built only from reviewed sections');
    assert.equal(article.classification, 'source_supported', 'This release makes scoped source-supported claims, not blanket register approval');
    assert.equal(article.latitude, undefined); assert.equal(article.longitude, undefined);
    assert.ok(!article.audio_url && !article.audio_asset_id, 'Audio needs separate clearance');
    assert.ok(canReleaseDialect(article, approval), 'Dialect needs a named source and example clearance');
    if (article.dialect) {
      assert.ok(article.sections.some(section => section.text.includes(article.dialect.meaning)), 'Dialect meaning must be in reviewed text');
      assert.ok(article.sections.some(section => section.kind === 'editorial_note' && section.text.includes(article.dialect.example)), 'Example must be explicitly editorial');
    }
    for (const section of article.sections) assert.ok(section.kind in factKindLabels && text(section.heading) && text(section.text));
    for (const claim of article.claims) {
      assert.ok(['fact','historical_interpretation','hypothesis','variant','register_entry'].includes(claim.kind));
      const source = sources.get(claim.source_id);
      assert.ok(source, `Claim has no reviewed source object: ${claim.source_id}`);
      if (source?.consulted_extent === 'abstract') assert.match(claim.locator, /tóm tắt|abstract/i);
      if (claim.kind === 'register_entry') assert.ok(['official_register','unesco_profile'].includes(source.source_type), 'A register claim needs a suitable official register');
      claims++;
    }
    for (const question of editorialQuestions) {
      const answer = article.answers[question.id]; assert.ok(answer && ['supported','partial','unknown'].includes(answer.state) && text(answer.text));
      assert.ok(answer.source_ids.every(id => article.claims.some(claim => claim.source_id === id)));
      if (answer.state !== 'unknown') assert.ok(answer.source_ids.length > 0, `Answer lacks evidence: ${article.id}/${question.id}`);
    }
    const binding = article.knowledge;
    assert.ok(domains.has(binding.primary_domain) && binding.secondary_domains.every(id => domains.has(id))); unique([binding.primary_domain, ...binding.secondary_domains], 'article domains');
    assert.ok(binding.regions.every(id => regions.has(id)) && binding.communities.every(id => communities.has(id)));
    assert.ok(binding.source_ids.length > 0 && binding.source_ids.every(id => article.claims.some(claim => claim.source_id === id))); assert.equal(binding.current_admin, null);
    for (const alias of binding.aliases) assert.ok(['alternate_name','historical_name','related_term','hypothesis_keyword'].includes(alias.kind) && text(alias.value) && text(alias.locator) && binding.source_ids.includes(alias.source_id), 'Alias lacks scoped provenance');
    for (const place of binding.historical_places ?? []) assert.ok(['area_as_recorded','publication_place'].includes(place.role) && text(place.name) && text(place.as_of) && text(place.locator) && binding.source_ids.includes(place.source_id), 'Historical name lacks provenance');
    for (const index of [binding.origin_section, binding.change_section]) if (index !== undefined) assert.ok(Number.isInteger(index) && index >= 0 && index < article.sections.length);
    for (const asset of article.media) {
      assert.ok(imagePathAllowed(asset.url) && permitsCommercialMedia(asset.license_name, asset.license_url) && https(asset.source_url));
      for (const key of ['author','modifications','caption','attribution']) assert.ok(text(asset[key]));
      assert.ok(asset.width > 0 && asset.height > 0 && /^[a-f0-9]{64}$/.test(asset.file_sha256));
      const bytes = mediaBytes.get(asset.url); assert.ok(bytes, `Missing asset ${asset.url}`);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.file_sha256, `Asset changed ${asset.url}`); assets++;
    }
  }
  for (const tour of release.tours) assert.ok(tour.kind === 'digital' && text(tour.title) && text(tour.description) && tour.content_ids.length > 1 && tour.content_ids.every(id => release.articles.some(article => article.id === id) || knownArticleIds.has(id) || ['E001','E011','NBS-BINH-THUY','NBS-CHO-NOI'].includes(id)), 'Reading journey has an unapproved stop');
  unique((release.events ?? []).map(event => event.id), 'events');
  for (const event of release.events ?? []) {
    const article = release.articles.find(article => article.id === event.content_id);
    assert.ok(article && article.claims.some(claim => claim.source_id === event.source_id), 'Event has no reviewed dossier/source');
    assert.ok(['publication','register','observed_event'].includes(event.kind) && ['day','year'].includes(event.precision));
    assert.ok(Number.isInteger(event.year) && text(event.value) && text(event.title) && text(event.locator) && text(event.source_as_written) && event.review_status === 'source_checked');
  }
  unique((release.locations ?? []).map(place => place.id), 'locations');
  for (const place of release.locations ?? []) {
    assert.ok(release.articles.some(article => article.id === place.content_id), 'Map pin has no released dossier');
    assert.ok(Number.isFinite(place.lat) && Math.abs(place.lat) <= 90 && Number.isFinite(place.lng) && Math.abs(place.lng) <= 180, 'Invalid map coordinate');
    assert.ok(place.status === 'proposed' && text(place.provenance), 'Spec coordinates must retain proposed provenance');
    assert.ok(['ecology','archaeology','worship','river','craft','arts'].includes(place.theme));
  }
  // Kỳ lễ: ngày lấy từ nguồn của chính gói này; ngày âm ghi kèm phải khớp lịch âm Việt Nam; nhãn trạng thái phải đúng loại nguồn.
  const occurrences = release.occurrences ?? [];
  unique(occurrences.map(o => o.id), 'festival occurrences');
  if (occurrences.length || approval.approved_occurrence_ids) assert.deepEqual([...(approval.approved_occurrence_ids ?? [])].sort(), occurrences.map(o => o.id).sort(), 'Approval must name exactly these festival dates');
  const iso = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00Z'));
  const known = id => release.articles.some(article => article.id === id) || knownArticleIds.has(id);
  for (const o of occurrences) {
    for (const key of ['id', 'name', 'edition', 'place_as_written', 'locator', 'source_as_written', 'why']) assert.ok(text(o[key]), `Festival date lacks ${key}: ${o.id}`);
    assert.ok(known(o.content_id) && (o.related_ids ?? []).every(known), `Festival date points to an unreleased dossier: ${o.id}`);
    assert.ok(['dong-nam-bo', 'tay-nam-bo', 'lien-vung'].includes(o.region), `Unknown region: ${o.id}`);
    assert.ok(o.place_id === null || (typeof o.place_id === 'string' && /^[a-z0-9-]+$/.test(o.place_id)), `Bad place id: ${o.id}`);
    assert.ok(iso(o.start) && iso(o.end) && o.start <= o.end, `Festival date range invalid: ${o.id}`);
    assert.ok(o.source_ids.length > 0 && o.source_ids.every(id => sources.has(id)), `Festival date lacks a source read for this release: ${o.id}`);
    for (const [which, [day, month]] of [['start', o.lunar.start], ['end', o.lunar.end]]) {
      const l = lunarOf(o[which]);
      assert.ok(l.day === day && l.month === month && !l.leap, `Lunar date does not match ${o[which]} for ${o.id}`);
      if (which === 'start') assert.equal(canChi(l.year), o.lunar.year, `Lunar year name mismatch: ${o.id}`);
    }
    const types = o.source_ids.map(id => sources.get(id).source_type);
    if (o.date_status === 'reported') assert.ok(o.end < approval.reviewed_at, `Reported festival has not happened yet: ${o.id}`);
    else if (o.date_status === 'announced') assert.ok(types.some(type => ['official_article', 'official_plan'].includes(type)), `Announced date needs an official source: ${o.id}`);
    else if (o.date_status === 'listed') assert.ok(types.includes('official_event_listing'), `Listed date needs an official event listing: ${o.id}`);
    else if (o.date_status === 'traditional') assert.ok(text(o.estimate_note) && /quy đổi/.test(o.estimate_note), `Traditional date must say it is an editorial conversion: ${o.id}`);
    else assert.fail(`Unknown festival date status: ${o.id}`);
    if (o.date_status !== 'reported') assert.ok(o.end >= approval.reviewed_at, `Future-only label on a past date: ${o.id}`);
  }
  const unicode = value => { if (typeof value === 'string') assert.ok(value === value.normalize('NFC') && !value.includes('\uFFFD'), 'Malformed Unicode'); else if (Array.isArray(value)) value.forEach(unicode); else if (value && typeof value === 'object') Object.values(value).forEach(unicode); };
  unicode(release); unicode(approval);
  return { articles: release.articles.length, sources: release.sources.length, claims, assets, reading_journeys: release.tours.length, ...(occurrences.length ? { festival_dates: occurrences.length } : {}) };
}
export const releaseDates = ['2026-10-28', '2026-11-01', '2026-11-01-supplement', '2026-11-02-enrichment', '2026-11-04-festivals'];
export async function loadValidatedRelease(date = '2026-10-28') {
  const bytes = await readFile(new URL(`data/release/published-${date}.json`, root));
  const release = JSON.parse(bytes.toString('utf8')); const approval = await json(`data/release/publication-approval-${date}.json`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), approval.release_sha256, 'Release bytes changed after source/rights review');
  assert.equal(createHash('sha256').update(JSON.stringify(release)).digest('hex'), approval.release_payload_sha256, 'Release semantic payload changed after approval');
  for (const [file, expected] of Object.entries(approval.legacy_files_sha256 ?? {})) {
    assert.ok(['lib/content-expansion.ts','data/knowledge/metadata.json'].includes(file), 'Unexpected legacy approval path');
    assert.equal(createHash('sha256').update(await readFile(new URL(file, root))).digest('hex'), expected, `Reviewed legacy source changed: ${file}`);
  }
  const seed = await json('lib/research-seed.json'), bundle = await json('lib/editorial-bundle.json');
  const mediaBytes = new Map(await Promise.all(release.articles.flatMap(article => article.media).map(async asset => { assert.ok(imagePathAllowed(asset.url)); return [asset.url, await readFile(new URL('public' + asset.url, root))]; })));
  // Nguồn đã có trong kho (kể cả gói duyệt trước) không được đổi URL hay loại nguồn khi đọc lại cho gói sau.
  const earlier = await Promise.all(releaseDates.filter(other => other < date).map(other => json(`data/release/published-${other}.json`)));
  const sourceMap = new Map([...seed.sources, ...bundle.sources, ...contentExpansion.sources, ...earlier.flatMap(other => other.sources)].map(source => [source.id, source]));
  const context = { sourceIds: new Set(sourceMap.keys()), sourceMap, mediaBytes, knownArticleIds: new Set(earlier.flatMap(other => other.articles.map(article => article.id))) };
  return { release, approval, context, counts: validatePublishedRelease(release, approval, context) };
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) { for (const date of process.argv[2] ? [process.argv[2]] : releaseDates) { const { counts } = await loadValidatedRelease(date); console.log(date, JSON.stringify(counts)); } }
