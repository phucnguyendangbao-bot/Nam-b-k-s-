import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReview, createLedger, loadInputs } from '../scripts/research-data.mjs';

const inputs = await loadInputs();
// Keep the research-only state as a separate fixture. A release is an explicit
// editorial action, not a side effect of loading claims or sample metadata.
const baseline = { ...inputs, release: undefined, expansion: inputs.baseExpansion };
const copy = () => structuredClone(baseline);
const baselineSourceIds = new Set([...baseline.seed.sources, ...baseline.bundle.sources, ...baseline.expansion.sources].map(source => source.id));
const baselineResearchSourceIds = new Set([...baselineSourceIds, ...[baseline.review, ...baseline.sourceReviews].flatMap(pack => pack.sources.map(source => source.id))]);

test('register evidence and full article verification have distinct totals', () => {
  const ledger = createLedger(baseline);
  const expected = {
    tracked: 48, registered_sources: baselineSourceIds.size, research_sources: baselineResearchSourceIds.size, article_source_checked: 25,
    publication_eligible: 25, published: 25, draft: 23,
    draft_with_checked_register_claim: 4, draft_with_checked_source_claim: 7, draft_research_pending: 12,
    checked_register_claims: 8, checked_source_claims: 8, newly_published: 0,
  };
  assert.deepEqual(Object.fromEntries(Object.keys(expected).map(key => [key, ledger.counts[key]])), expected);
  assert.equal(ledger.items.length, new Set(ledger.items.map(item => item.id)).size);
  for (const id of ['E015', 'E016', 'E017', 'E019']) {
    const item = ledger.items.find(item => item.id === id);
    assert.equal(item.publication_status, 'draft');
    assert.equal(item.verification, 'register_claim_only');
  }
});

test('new source dossiers remain drafts with exact consulted extent and claim links', () => {
  const ledger = createLedger(baseline);
  const pack = inputs.sourceReviews[0];
  assert.equal(pack.records.length, 7);
  assert.equal(validateReview(pack, inputs.seed).source_claims, 8);
  for (const record of pack.records) {
    const item = ledger.items.find(item => item.id === record.content_id);
    assert.equal(item.publication_status, 'draft');
    assert.equal(item.verification, 'source_claim_only');
    assert.equal(record.dossier.media_status, 'not_cleared');
  }
  for (const id of ['E006', 'E007']) assert.equal(ledger.items.find(item => item.id === id).verification, 'research_pending');
});

test('abstracts, bibliography and extra evidence cannot bypass source checking', () => {
  for (const mutation of [
    pack => { pack.records.find(record => record.content_id === 'E036').locator = 'Full text, page 46'; },
    pack => { pack.records[0].additional_claims[0].source_id = 'R-TANG-LVD-2009-INDEX'; },
    pack => { pack.records[0].additional_claims[0].content_id = 'E003'; },
    pack => { pack.records[0].dossier.sections[0].claim_ids = ['MISSING-CLAIM']; },
    pack => { pack.sources.find(source => source.new_source).new_source = false; },
    pack => { pack.records[0].dossier.publication_status = 'published'; },
  ]) {
    const next = copy();
    mutation(next.sourceReviews[0]);
    assert.throws(() => createLedger(next));
  }
});

test('publication and coordinates cannot be smuggled through a source review', () => {
  for (const mutation of [
    pack => { pack.publication_action = 'publish'; },
    pack => { pack.records[0].status = 'published'; },
    pack => { pack.records[0].latitude = 10; },
    pack => { pack.records[0].media = []; },
  ]) {
    const { review, seed } = copy();
    mutation(review);
    assert.throws(() => validateReview(review, seed));
  }
});

test('catalogs, missing locators, duplicate claims and workbook drift fail validation', () => {
  for (const mutation of [
    pack => { pack.records[0].source_id = 'S06'; },
    pack => { pack.records[0].locator = ''; },
    pack => { pack.records[1].claim_id = pack.records[0].claim_id; },
    pack => { pack.input_workbook_sha256 = '0'.repeat(64); },
    pack => { pack.sources[0].url = 'https://example.invalid/other-register'; },
    pack => { pack.records[0].decision_date = '2022-02-30'; },
  ]) {
    const { review, seed } = copy();
    mutation(review);
    assert.throws(() => validateReview(review, seed));
  }
});

test('context observations and a prepared bundle do not become published articles', () => {
  const next = copy();
  next.bundle.articles.push({ ...structuredClone(next.bundle.articles[0]), id: 'E019', title: 'A draft with a source' });
  const ledger = createLedger(next);
  assert.equal(ledger.counts.published, 25);
  for (const id of ['E005', 'E028']) {
    assert.equal(ledger.items.find(item => item.id === id).verification, 'research_pending');
  }
  assert.equal(ledger.items.find(item => item.id === 'E019').publication_status, 'draft');
});

test('report generation preserves the source snapshots and tracks every draft', () => {
  const before = JSON.stringify(baseline);
  const ledger = createLedger(baseline);
  assert.equal(JSON.stringify(baseline), before);
  const drafts = ledger.items.filter(item => item.publication_status === 'draft');
  assert.equal(drafts.length, 23);
  assert.ok(drafts.every(item => item.next_action.length > 20));
  for (const id of ['E006', 'E007', 'E038', 'E039', 'E040']) {
    assert.equal(drafts.find(item => item.id === id).verification, 'research_pending');
  }
});

test('explicit reviewed release publishes seven records while the research baseline stays unchanged', () => {
  assert.ok(inputs.release, 'Expected the separately approved release package');
  const before = JSON.stringify(inputs);
  const released = createLedger(inputs);
  const old = createLedger(baseline);
  const oldIds = new Set(old.items.filter(item => item.publication_status === 'published').map(item => item.id));
  const newIds = released.items.filter(item => item.publication_status === 'published' && !oldIds.has(item.id)).map(item => item.id).sort();
  assert.equal(released.counts.published, 32);
  assert.equal(released.counts.article_source_checked, 32);
  assert.equal(released.counts.publication_eligible, 32);
  assert.equal(released.counts.draft, 22);
  assert.equal(released.counts.tracked, 54);
  assert.equal(released.counts.newly_published, 7);
  assert.deepEqual(newIds, inputs.release.articles.map(item => item.id).sort());
  assert.equal(released.items.length, new Set(released.items.map(item => item.id)).size);
  assert.equal(JSON.stringify(inputs), before);
  assert.equal(old.counts.published, 25);
  assert.equal(old.counts.draft, 23);
  for (const id of ['E006', 'E007', 'E038', 'E039', 'E040']) {
    assert.equal(released.items.find(item => item.id === id).publication_status, 'draft');
  }
});
