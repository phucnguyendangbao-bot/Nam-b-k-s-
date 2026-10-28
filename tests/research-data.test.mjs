import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReview, createLedger, loadInputs } from '../scripts/research-data.mjs';

const inputs = await loadInputs();
const copy = () => structuredClone(inputs);

test('register evidence and full article verification have distinct totals', () => {
  const ledger = createLedger(inputs);
  assert.deepEqual(ledger.counts, {
    tracked: 48, registered_sources: 45, article_source_checked: 25,
    publication_eligible: 25, published: 25, draft: 23,
    draft_with_checked_register_claim: 4, draft_research_pending: 19,
    checked_register_claims: 8, newly_published: 0,
  });
  assert.equal(ledger.items.length, new Set(ledger.items.map(item => item.id)).size);
  for (const id of ['E015', 'E016', 'E017', 'E019']) {
    const item = ledger.items.find(item => item.id === id);
    assert.equal(item.publication_status, 'draft');
    assert.equal(item.verification, 'register_claim_only');
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
  const before = JSON.stringify(inputs);
  const ledger = createLedger(inputs);
  assert.equal(JSON.stringify(inputs), before);
  const drafts = ledger.items.filter(item => item.publication_status === 'draft');
  assert.equal(drafts.length, 23);
  assert.ok(drafts.every(item => item.next_action.length > 20));
  for (const id of ['E006', 'E007', 'E038', 'E039', 'E040']) {
    assert.equal(drafts.find(item => item.id === id).verification, 'research_pending');
  }
});
