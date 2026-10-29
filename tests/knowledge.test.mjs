import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadKnowledgeInputs, auditKnowledge } from '../scripts/audit-knowledge.mjs';
import { filterKnowledge, validateKnowledge, duplicateCandidates, relatedKnowledge, knowledgeSearchText } from '../lib/knowledge-core.ts';
import { createMemoryDraft } from '../lib/memory-draft.ts';
import { knowledgeDomains } from '../lib/knowledge-taxonomy.ts';

const data = await loadKnowledgeInputs();
const items = data.articles.map(item => ({ ...item, status: 'published', knowledge: data.metadata.bindings[item.id] }));
test('12 domains map 32 approved public records and preserve three promoted sample identities', () => {
  const audit = auditKnowledge(data);
  assert.equal(knowledgeDomains.length, 12); assert.equal(audit.mapped_articles, 32); assert.equal(audit.counts.total_tracked, 54);
  assert.equal(audit.counts.newly_published, 7); assert.equal(audit.counts.publication_eligible, 32);
  assert.equal(audit.counts.promoted_samples, 3); assert.equal(audit.counts.sample_drafts, 0);
  assert.equal(audit.sample_claims, 6);
  assert.equal(audit.counts.source_union, new Set([...data.context.sourceIds, ...data.samples.sources.map(source => source.id)]).size);
  for (const sample of data.samples.samples) assert.equal(items.filter(item => item.id === sample.id).length, 1);
  for (const domain of knowledgeDomains) assert.ok(filterKnowledge(items, { domain: domain.id }).length > 0, `Empty domain: ${domain.id}`);
});
test('accentless historical place lookup preserves publication-place meaning', () => {
  const result = filterKnowledge(items, { q: 'sai gon' });
  assert.ok(result.some(item => item.id === 'NBS-TUCNGU-18'));
  const binding = data.metadata.bindings['NBS-TUCNGU-18'];
  assert.equal(binding.historical_places[0].role, 'publication_place');
  assert.equal(binding.current_admin, null); assert.deepEqual(binding.regions, []);
});
test('hypothesis terms can be found without becoming equivalent names', () => {
  const result = filterKnowledge(items, { q: 'ca rang' });
  assert.ok(result.some(item => item.id === 'E021'));
  assert.equal(data.metadata.bindings.E021.aliases[0].kind, 'hypothesis_keyword');
  assert.match(knowledgeSearchText(data.metadata.bindings['NBS-NINH-KIEU']), /cong vien ninh kieu/);
});
test('filters intersect; draft records cannot enter public results or relations', () => {
  assert.equal(filterKnowledge(items, { domain: 'phuong-ngu-nam-bo' }).length, 8);
  assert.ok(filterKnowledge(items, { region: 'dong-nam-bo' }).length > 0);
  assert.ok(filterKnowledge(items, { region: 'tay-nam-bo' }).length > 0);
  assert.ok(filterKnowledge(items, { community: 'hoa' }).length > 0);
  assert.ok(filterKnowledge(items, { community: 'cham' }).length > 0);
  assert.equal(filterKnowledge(items, { community: 'khmer', domain: 'le-hoi' }).length, 4);
  const draft = { ...items[0], id: 'private', status: 'draft' };
  assert.equal(filterKnowledge([draft], {}).length, 0);
  assert.ok(!relatedKnowledge(items[0], [...items, draft]).some(link => link.item.id === 'private'));
});
test('duplicate detection queues manual decisions and keeps differing entities', () => {
  const result = duplicateCandidates([{ id: 'a', name: 'Cái Răng', entity_type: 'place' }, { id: 'b', name: 'Cai Rang', entity_type: 'market' }, { id: 'c', name: 'Cai Rang', entity_type: 'place' }]);
  assert.ok(result.some(row => row.left === 'a' && row.right === 'c' && row.reason === 'same_normalized_name'));
  assert.ok(result.some(row => row.left === 'a' && row.right === 'b' && row.reason === 'shared_alias'));
  assert.ok(result.every(row => row.decision === 'pending' && row.auto_merge === false));
});
test('archived sample drafts retain their seven bounded answers and cannot grant publication themselves', () => {
  for (const mutate of [pack => pack.samples[0].publish_approval = true, pack => pack.samples[0].latitude = 10, pack => pack.samples[0].media.push({}), pack => delete pack.samples[0].answers.origins, pack => pack.samples[0].answers.what.claim_ids = [], pack => pack.samples[0].claims[0].kind = 'made_up']) {
    const pack = structuredClone(data.samples); mutate(pack);
    assert.throws(() => validateKnowledge(data.metadata, pack, data.context));
  }
});

test('released dossiers have seven source-bounded answers, genuine references and no invented media', () => {
  const released = data.inputs.release.articles;
  assert.equal(released.length, 7);
  for (const article of released) {
    const sources = new Set(article.claims.map(claim => claim.source_id));
    assert.equal(Object.keys(article.answers).length, 7, article.id);
    for (const key of ['what', 'when_where', 'community', 'origins', 'changes', 'unknowns', 'related']) {
      const answer = article.answers[key];
      assert.ok(answer?.text.trim(), `${article.id}: ${key}`);
      assert.ok(['supported', 'partial', 'unknown'].includes(answer.state));
      assert.ok(answer.source_ids.every(id => sources.has(id)), `${article.id}: answer with orphan source`);
      if (answer.state !== 'unknown') assert.ok(answer.source_ids.length > 0, `${article.id}: unsupported answer`);
    }
    assert.equal(article.knowledge.current_admin, null);
    assert.ok(!('latitude' in article) && !('longitude' in article));
    assert.ok(article.claims.every(claim => data.context.sourceIds.has(claim.source_id) && claim.locator.trim() && claim.statement.trim()));
    assert.ok(!article.audio_url);
  }
});
test('bibliographic year precision and official register evidence stay distinct', () => {
  const metadata = structuredClone(data.metadata);
  assert.equal(metadata.events[0].precision, 'year'); assert.equal(metadata.events[0].value, '1897');
  metadata.events[0].value = '1897-01-01';
  assert.throws(() => validateKnowledge(metadata, data.samples, data.context));
  const badRegister = structuredClone(data.metadata); badRegister.events.find(event => event.kind === 'register').value = '2013-01-01';
  assert.throws(() => validateKnowledge(badRegister, data.samples, data.context));
});
test('new factual metadata needs linked sources; invalid Unicode is rejected', () => {
  const metadata = structuredClone(data.metadata); metadata.bindings.E020.source_ids.push('UNKNOWN');
  assert.throws(() => validateKnowledge(metadata, data.samples, data.context));
  const broken = structuredClone(data.metadata); broken.bindings.E020.name = '\uFFFD';
  assert.throws(() => validateKnowledge(broken, data.samples, data.context));
});
test('related links disclose an editorial relationship without asserting causation', () => {
  const links = relatedKnowledge(items.find(item => item.id === 'E029'), items, 5);
  assert.ok(links.length > 0);
  assert.ok(links.every(link => ['Chung nguồn tham khảo', 'Cùng lĩnh vực để đọc tiếp'].includes(link.reason)));
});
test('memory consent never grants publication or fabricates a date or narrator', () => {
  const input = { title: 'Bản thử kỹ thuật', narrator: '', date: '', place: '', text: 'Nội dung thử', provenance: 'Dữ liệu kiểm thử', storageConsent: true, publicationConsent: true };
  const draft = createMemoryDraft(input);
  assert.equal(draft.status, 'draft'); assert.equal(draft.publish_approval, false); assert.equal(draft.recorded_date, null); assert.equal(draft.narrator_as_recorded, null);
  assert.equal(draft.verification, 'unverified'); assert.deepEqual(draft.audio, []);
  assert.throws(() => createMemoryDraft({ ...input, storageConsent: false }));
});
test('sample package stays outside public assets and public adapter', async () => {
  const adapter = await readFile(new URL('../lib/knowledge.ts', import.meta.url), 'utf8');
  const api = await readFile(new URL('../app/api/knowledge/route.ts', import.meta.url), 'utf8');
  assert.ok(!adapter.includes('samples.json')); assert.ok(!api.includes('samples.json'));
});
