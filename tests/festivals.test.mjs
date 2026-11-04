import test from 'node:test';
import assert from 'node:assert/strict';
import { loadValidatedRelease, validatePublishedRelease } from '../scripts/validate-published-release.mjs';
import { lunarOf, canChi } from '../lib/lunar.ts';
import { formatRange, icsFor, lunarLabel, timeStatus, todayInVietnam } from '../lib/festival-format.ts';

const data = await loadValidatedRelease('2026-11-04-festivals');
const check = release => validatePublishedRelease(release, data.approval, data.context);

test('festival layer: one dossier and six dated occurrences, each bound to the approval', () => {
  assert.equal(data.counts.articles, 1); assert.equal(data.counts.festival_dates, 6);
  assert.deepEqual([...data.approval.approved_occurrence_ids].sort(), data.release.occurrences.map(o => o.id).sort());
});
test('Vietnamese lunar calendar matches dates reported by sources', () => {
  // Các cặp ngày dương–âm do chính nguồn ghi: Báo Văn Hóa 2026, Báo Cần Thơ 2026, TTXVN 2024, Đại biểu Nhân dân 2025.
  for (const [iso, d, m] of [['2026-05-28', 12, 4], ['2026-05-31', 15, 4], ['2026-02-01', 14, 12], ['2024-01-24', 14, 12], ['2025-02-12', 15, 1]]) {
    const l = lunarOf(iso); assert.deepEqual([l.day, l.month, l.leap], [d, m, false], iso);
  }
  assert.equal(canChi(2026), 'Bính Ngọ'); assert.equal(canChi(2025), 'Ất Tỵ'); assert.equal(canChi(2027), 'Đinh Mùi');
});
test('a festival date cannot drift from its lunar date, source type or label', () => {
  const mutate = fn => { const r = structuredClone(data.release); fn(r.occurrences); return r; };
  assert.throws(() => check(mutate(o => { o[0].start = '2026-01-31'; })), /Lunar date/);
  assert.throws(() => check(mutate(o => { o.find(x => x.date_status === 'listed').source_ids = ['NB-DINHBT-ND-2026']; })), /official event listing/);
  assert.throws(() => check(mutate(o => { o.find(x => x.date_status === 'announced').source_ids = ['NB-OOB-BCT-2026']; })), /official source/);
  assert.throws(() => check(mutate(o => { delete o.find(x => x.date_status === 'traditional').estimate_note; })), /editorial conversion/);
  assert.throws(() => check(mutate(o => { o.find(x => x.date_status === 'listed').date_status = 'reported'; })), /not happened/);
  assert.throws(() => check(mutate(o => { o[0].source_ids = ['S99']; })), /source read/);
  assert.throws(() => check(mutate(o => { o[0].content_id = 'E999'; })), /unreleased dossier/);
  assert.throws(() => check(mutate(o => { o.push({ ...o[0], id: 'NEW' }); })), /exactly these festival dates/);
});
test('time status, formatting and calendar file', () => {
  const o = { start: '2026-11-22', end: '2026-11-24' };
  assert.equal(timeStatus(o, '2026-11-04'), 'upcoming'); assert.equal(timeStatus(o, '2026-11-23'), 'ongoing'); assert.equal(timeStatus(o, '2026-11-25'), 'past');
  assert.match(todayInVietnam(new Date('2026-11-04T18:30:00Z')), /^2026-11-05$/);
  assert.equal(formatRange('2026-11-22', '2026-11-24'), '22–24/11/2026');
  assert.equal(formatRange('2026-05-28', '2026-06-02'), '28/5–2/6/2026');
  assert.equal(formatRange('2027-02-20', '2027-02-20'), '20/2/2027');
  assert.equal(lunarLabel({ start: [14, 12], end: [15, 12], year: 'Bính Ngọ' }), '14–15 tháng Chạp năm Bính Ngọ');
  const ics = icsFor({ id: 'X', name: 'Lễ, thử; ngày', edition: 'Năm 2026', start: '2026-11-22', end: '2026-11-24', place_as_written: 'A', why: 'B', statusNote: 'C' }, 'https://e.x/');
  assert.match(ics, /DTSTART;VALUE=DATE:20261122\r\n/); assert.match(ics, /DTEND;VALUE=DATE:20261125\r\n/); assert.ok(ics.includes(String.raw`SUMMARY:Lễ\, thử\; ngày`));
  assert.ok(ics.split('\r\n').every(line => [...line].length <= 75));
});
