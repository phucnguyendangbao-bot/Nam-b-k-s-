import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { canReleaseArticle } from '../lib/release-model.ts';
import { editorialQuestions, factKindLabels, knowledgeDomains, knowledgeRegions, knowledgeCommunities } from '../lib/knowledge-taxonomy.ts';
import { imagePathAllowed, permitsCommercialMedia, sectionBody } from '../lib/editorial-model.ts';
import { contentExpansion } from '../lib/content-expansion.ts';

const root = new URL('../', import.meta.url);
const json = async file => JSON.parse(await readFile(new URL(file, root), 'utf8'));
const text = value => typeof value === 'string' && value.trim().length > 0;
const https = value => { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; } };
const unique = (values, label) => assert.equal(new Set(values).size, values.length, `Duplicate ${label}`);
export function validatePublishedRelease(release, approval, { sourceIds, sourceMap = new Map(), mediaBytes }) {
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
    assert.ok(['full_article','transcription','abstract','register_entry'].includes(source.consulted_extent), `Unknown consulted extent ${source.id}`);
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
    assert.equal(article.latitude, undefined); assert.equal(article.longitude, undefined); assert.ok(!article.dialect && !article.audio_url && !article.audio_asset_id, 'Audio and dialect need separate clearance');
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
  for (const tour of release.tours) assert.ok(tour.kind === 'digital' && text(tour.title) && text(tour.description) && tour.content_ids.length > 1 && tour.content_ids.every(id => release.articles.some(article => article.id === id) || ['E001','E011','NBS-BINH-THUY','NBS-CHO-NOI'].includes(id)), 'Reading journey has an unapproved stop');
  const unicode = value => { if (typeof value === 'string') assert.ok(value === value.normalize('NFC') && !value.includes('\uFFFD'), 'Malformed Unicode'); else if (Array.isArray(value)) value.forEach(unicode); else if (value && typeof value === 'object') Object.values(value).forEach(unicode); };
  unicode(release); unicode(approval);
  return { articles: release.articles.length, sources: release.sources.length, claims, assets, reading_journeys: release.tours.length };
}
export async function loadValidatedRelease() {
  const bytes = await readFile(new URL('data/release/published-2026-10-28.json', root));
  const release = JSON.parse(bytes.toString('utf8')); const approval = await json('data/release/publication-approval-2026-10-28.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), approval.release_sha256, 'Release bytes changed after source/rights review');
  assert.equal(createHash('sha256').update(JSON.stringify(release)).digest('hex'), approval.release_payload_sha256, 'Release semantic payload changed after approval');
  for (const [file, expected] of Object.entries(approval.legacy_files_sha256 ?? {})) {
    assert.ok(['lib/content-expansion.ts','data/knowledge/metadata.json'].includes(file), 'Unexpected legacy approval path');
    assert.equal(createHash('sha256').update(await readFile(new URL(file, root))).digest('hex'), expected, `Reviewed legacy source changed: ${file}`);
  }
  const seed = await json('lib/research-seed.json'), bundle = await json('lib/editorial-bundle.json');
  const mediaBytes = new Map(await Promise.all(release.articles.flatMap(article => article.media).map(async asset => { assert.ok(imagePathAllowed(asset.url)); return [asset.url, await readFile(new URL('public' + asset.url, root))]; })));
  const sourceMap = new Map([...seed.sources, ...bundle.sources, ...contentExpansion.sources].map(source => [source.id, source]));
  const context = { sourceIds: new Set(sourceMap.keys()), sourceMap, mediaBytes };
  return { release, approval, context, counts: validatePublishedRelease(release, approval, context) };
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) { const { counts } = await loadValidatedRelease(); console.log(JSON.stringify(counts, null, 2)); }
