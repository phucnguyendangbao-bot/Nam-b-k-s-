import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import ts from 'typescript';
import { imagePathAllowed, permitsCommercialMedia } from '../lib/editorial-model.ts';

const root = new URL('../', import.meta.url);
export const reviewFile = new URL('data/research/register-review-2026-10-28.json', root);
const classifications = new Set(['official_register', 'source_supported', 'research_lead', 'bibliographic_lead', 'proposed_not_verified']);
const text = value => typeof value === 'string' && value.trim().length > 0;
const isoDate = value => text(value) && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const safeUrl = value => {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
};
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const unique = (values, label) => assert.equal(new Set(values).size, values.length, `Duplicate ${label}`);

export function claimsForRecord(record) {
  return [record, ...(record.additional_claims ?? []).map(claim => ({ ...record, ...claim }))];
}

/** This validates a research package, never grants publication permission. */
export function validateReview(pack, seed) {
  assert.equal(pack.publication_action, 'none', 'Research imports cannot publish');
  assert.ok(text(pack.version) && text(pack.reviewer) && text(pack.scope));
  assert.ok(isoDate(pack.reviewed_at), 'Invalid review date');
  assert.equal(pack.input_workbook_sha256, seed.sha256, 'Workbook provenance mismatch');
  const sources = new Map(seed.sources.map(source => [source.id, source]));
  const contents = new Set(seed.contents.map(content => content.id));
  const reviewedSources = new Map();
  unique(pack.sources.map(source => source.id), 'sources');
  for (const source of pack.sources) {
    const registered = sources.get(source.id);
    if (registered) {
      assert.equal(source.url, registered.url, `Source URL mismatch: ${source.id}`);
      assert.equal(source.source_type, registered.source_type);
    } else {
      assert.equal(source.new_source, true, `Unregistered source ${source.id}`);
      for (const key of ['id', 'name', 'publisher', 'source_type', 'consulted_extent', 'license_reported']) assert.ok(text(source[key]), `Missing source ${key}`);
    }
    assert.ok(safeUrl(source.url) && text(source.source_version) && text(source.rights_basis));
    reviewedSources.set(source.id, source);
  }
  unique(pack.records.map(record => record.content_id), 'content reviews');
  unique(pack.records.flatMap(claimsForRecord).map(record => record.claim_id), 'claims');
  assert.ok(pack.records.length > 0);
  for (const record of pack.records) {
    assert.ok(contents.has(record.content_id), `Unknown content ${record.content_id}`);
    assert.ok(['official_register', 'source_supported'].includes(record.classification));
    for (const extra of record.additional_claims ?? []) {
      assert.equal(extra.content_id, undefined, 'Additional evidence cannot change its content ID');
      assert.equal(extra.classification, undefined, 'Additional evidence cannot change its classification');
      assert.equal(extra.additional_claims, undefined, 'Nested claim collections are not supported');
    }
    for (const claim of claimsForRecord(record)) {
      const source = reviewedSources.get(claim.source_id);
      assert.ok(source, `Source not reviewed: ${claim.source_id}`);
      assert.equal(claim.review_status, 'accepted');
      for (const key of ['claim_id', 'statement', 'locator', 'historical_area', 'scope']) assert.ok(text(claim[key]), `Missing ${key}: ${claim.content_id}`);
      if (record.classification === 'official_register') {
        assert.equal(claim.claim_kind, 'register_entry');
        assert.equal(source.source_type, 'official_register', 'Catalogs and articles cannot prove register entries');
        for (const key of ['register_number', 'decision_number']) assert.ok(text(claim[key]));
        assert.ok(isoDate(claim.decision_date) && claim.decision_date <= pack.reviewed_at);
      } else {
        assert.ok(['fact', 'hypothesis', 'variant', 'historical_interpretation'].includes(claim.claim_kind));
        assert.ok(!['library_catalog', 'book_notice', 'bibliographic_index'].includes(source.source_type), 'An index is not content evidence');
        assert.ok(['full_article', 'transcription', 'abstract'].includes(source.consulted_extent), 'Consulted extent does not support this claim');
        if (source.consulted_extent === 'abstract') assert.match(claim.locator, /tóm tắt|abstract/i, 'An abstract cannot support a full-text page locator');
      }
    }
    assert.equal(record.status, undefined, 'Research records must not set editorial status');
    assert.equal(record.media, undefined, 'Media need a separate rights review');
    assert.equal(record.latitude, undefined, 'Register metadata cannot approve coordinates');
    assert.equal(record.longitude, undefined, 'Register metadata cannot approve coordinates');
    if (record.dossier) {
      const dossier = record.dossier;
      assert.equal(dossier.publication_status, 'draft');
      assert.equal(dossier.media_status, 'not_cleared');
      assert.equal(dossier.audio_asset_id, null);
      assert.ok(text(dossier.introduction) && text(dossier.next_action) && dossier.sections?.length > 0);
      const ids = new Set(claimsForRecord(record).map(claim => claim.claim_id));
      for (const section of dossier.sections) {
        assert.ok(text(section.heading) && text(section.text));
        assert.ok(['documented_history', 'observed_practice', 'folk_belief', 'hypothesis', 'explanation', 'editorial_note'].includes(section.kind));
        assert.ok(section.claim_ids?.length > 0 && section.claim_ids.every(id => ids.has(id)), 'Draft section has no reviewed claim');
      }
    }
  }
  for (const lead of pack.leads) {
    assert.ok(contents.has(lead.content_id) && (sources.has(lead.source_id) || reviewedSources.has(lead.source_id)));
    assert.ok(classifications.has(lead.classification));
    assert.ok(['lead', 'context'].includes(lead.relation));
    assert.ok(text(lead.note) && text(lead.next_action));
  }
  unique(pack.observations.map(observation => observation.id), 'observations');
  for (const observation of pack.observations) {
    assert.ok(sources.has(observation.source_id) || reviewedSources.has(observation.source_id));
    assert.ok(isoDate(observation.observed_at) && observation.observed_at <= pack.reviewed_at);
    assert.ok(safeUrl(observation.url));
    for (const key of ['id', 'locator', 'finding', 'method']) assert.ok(text(observation[key]));
  }
  const checkUnicode = value => {
    if (typeof value === 'string') assert.ok(value === value.normalize('NFC') && !value.includes('\uFFFD'), 'Invalid Vietnamese Unicode');
    else if (Array.isArray(value)) value.forEach(checkUnicode);
    else if (value && typeof value === 'object') Object.values(value).forEach(checkUnicode);
  };
  checkUnicode(pack);
  return { register_claims: pack.records.flatMap(claimsForRecord).filter(claim => claim.claim_kind === 'register_entry').length,
    source_claims: pack.records.flatMap(claimsForRecord).filter(claim => claim.classification === 'source_supported').length,
    research_leads: pack.leads.length, observations: pack.observations.length };
}

export async function loadInputs() {
  const [review, sourceReview, seed, bundle, expansionSource] = await Promise.all([
    json(reviewFile), json(new URL('data/research/source-review-2026-10-28.json', root)), json(new URL('lib/research-seed.json', root)),
    json(new URL('lib/editorial-bundle.json', root)), readFile(new URL('lib/content-expansion.ts', root), 'utf8'),
  ]);
  // The data module has only a type import. Refuse new runtime dependencies rather
  // than resolving them differently from the application.
  const output = ts.transpileModule(expansionSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  assert.ok(!/^import\s/m.test(output), 'Expansion data gained a runtime import; update the snapshot reader');
  const { contentExpansion: expansion } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
  return { review, sourceReviews: [sourceReview], seed, bundle, expansion };
}

export function createLedger({ review, sourceReviews = [], seed, bundle, expansion }) {
  const reviews = [review, ...sourceReviews];
  reviews.forEach(pack => validateReview(pack, seed));
  const reviewedRecords = reviews.flatMap(pack => pack.records);
  unique(reviewedRecords.map(record => record.content_id), 'content reviews across packages');
  unique(reviewedRecords.flatMap(claimsForRecord).map(claim => claim.claim_id), 'claims across packages');
  const sources = new Map([...seed.sources, ...bundle.sources, ...expansion.sources].map(source => [source.id, source]));
  // The eleven IDs explicitly approved by the owner on 27 October. Merely
  // appending a prepared article to editorial-bundle.json is not an approval.
  const ownerApproved = new Set(['E001', 'E008', 'E020', 'E021', 'E029', 'E030', 'E031', 'E032', 'E033', 'NBS-BINH-THUY', 'NBS-CHO-NOI']);
  const articles = [...bundle.articles, ...expansion.articles];
  unique(articles.map(article => article.id), 'release articles');
  const published = articles.filter(article => {
    const approved = ownerApproved.has(article.id) || (article.publication_status === 'published'
      && article.review_status === 'verified' && article.rights_review_status === 'cleared');
    return approved && article.claims?.length > 0
      && article.claims.every(claim => sources.has(claim.source_id) && text(claim.statement) && text(claim.locator))
      && (article.sections ?? []).every(section => section.sourceIds?.length > 0 && section.sourceIds.every(id => sources.has(id)))
      && (article.media ?? []).every(asset => imagePathAllowed(asset.url) && asset.commercial_allowed === 1
        && text(asset.author) && text(asset.source_url) && text(asset.modifications) && permitsCommercialMedia(asset.license_name, asset.license_url));
  });
  const publishedIds = new Set(published.map(article => article.id));
  const researchSources = new Map(sources);
  for (const pack of reviews) for (const source of pack.sources) {
    const old = researchSources.get(source.id);
    assert.ok(!old || old.url === source.url, `Conflicting source URL across packages: ${source.id}`);
    researchSources.set(source.id, source);
  }
  const reviewed = new Map(reviewedRecords.map(record => [record.content_id, record]));
  const leads = reviews.flatMap(pack => pack.leads);
  const rows = new Map(seed.contents.map(content => [content.id, content]));
  for (const article of articles) rows.set(article.id, { ...rows.get(article.id), ...article });
  const items = [...rows.values()].map(content => {
    const proof = reviewed.get(content.id);
    const isPublic = publishedIds.has(content.id);
    return {
      id: content.id, title: content.title, category: content.category,
      publication_status: isPublic ? 'published' : 'draft',
      verification: isPublic ? 'article_source_checked' : proof?.classification === 'official_register' ? 'register_claim_only'
        : proof ? 'source_claim_only' : 'research_pending',
      research_classification: proof?.classification ?? content.classification ?? 'source_supported',
      register_claim_id: proof?.classification === 'official_register' ? proof.claim_id : null,
      source_claim_ids: proof?.classification === 'source_supported' ? claimsForRecord(proof).map(claim => claim.claim_id) : [],
      next_action: isPublic ? 'Theo dõi thay đổi nguồn và quyền; không tự thay bản công bố.'
        : proof ? proof.dossier?.next_action ?? `${proof.scope} Cần bài viết, quyền tài sản và duyệt biên tập trước khi công bố.`
          : leads.findLast(lead => lead.content_id === content.id)?.next_action
            ?? (content.classification === 'bibliographic_lead' ? 'Đọc tài liệu hợp pháp và dẫn trang cụ thể trước khi nâng mức kiểm chứng.'
              : content.classification === 'proposed_not_verified' ? 'Giữ đề xuất; cần hồ sơ, vị trí và khả năng tiếp cận đã duyệt trước khi xây tuyến.'
                : 'Tìm nguồn gốc có địa bàn, thời kỳ và locator; đối chiếu từng nhận định, quyền và dị bản.'),
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
  const checkedDrafts = items.filter(item => item.verification === 'register_claim_only').length;
  const sourceDrafts = items.filter(item => item.verification === 'source_claim_only').length;
  return {
    reviewed_at: review.reviewed_at, scope: review.scope,
    counts: { tracked: items.length, registered_sources: sources.size, research_sources: researchSources.size, article_source_checked: published.length,
      publication_eligible: published.length, published: published.length, draft: items.length - published.length,
      draft_with_checked_register_claim: checkedDrafts, draft_with_checked_source_claim: sourceDrafts,
      draft_research_pending: items.length - published.length - checkedDrafts - sourceDrafts,
      checked_register_claims: reviewedRecords.filter(record => record.classification === 'official_register').flatMap(claimsForRecord).length,
      checked_source_claims: reviewedRecords.filter(record => record.classification === 'source_supported').flatMap(claimsForRecord).length,
      newly_published: 0 },
    definitions: {
      checked_register_claims: 'Số nhận định ghi danh đã đối chiếu; không phải số bài hoàn chỉnh hoặc quyền ảnh/âm thanh.',
      draft_with_checked_register_claim: 'Bản nháp có chứng minh ghi danh, còn thiếu bài/quyền/duyệt; nằm trong tổng bản nháp.',
      draft_with_checked_source_claim: 'Có nhận định được đối chiếu theo đúng phạm vi tài liệu; chưa phải bài hoàn chỉnh đã duyệt.',
      research_sources: 'Nguồn của snapshot công khai và các gói nghiên cứu, gồm đầu mối thư mục; không đồng nghĩa tất cả đã đọc toàn văn.',
      sqlite: 'SQLite chỉ chứa 40 mục workbook; phải đọc báo cáo SQLite riêng, không cộng thẳng vào 48 hồ sơ website.',
      approval: 'Gói nghiên cứu không thay đổi bài, tour hoặc cổng công bố của website.',
    },
    items,
  };
}

export function renderReport(ledger, review, sourceReviews = []) {
  const n = ledger.counts;
  const drafts = ledger.items.filter(item => item.publication_status === 'draft');
  return `# Tiến độ kho dữ liệu — ${review.reviewed_at}

Gói nghiên cứu: \`${review.version}\`. Chỉ bổ sung chứng minh và đầu mối, không công bố bài mới.
${sourceReviews.map(pack => `Gói bổ sung: \`${pack.version}\` — ${pack.records.length} hồ sơ nháp, ${pack.records.flatMap(claimsForRecord).length} nhận định có phạm vi.`).join('\n')}

| Chỉ tiêu của snapshot website | Số mục |
|---|---:|
| Hồ sơ và ý tưởng riêng biệt | ${n.tracked} |
| Nguồn đăng ký | ${n.registered_sources} |
| Nguồn trong kho nghiên cứu và snapshot (không cộng trùng) | ${n.research_sources} |
| Bài đã đối chiếu nguồn và đang công bố | ${n.published} |
| Bản nháp cần hoàn thiện | ${n.draft} |
| Trong số bản nháp: có chứng minh ghi danh | ${n.draft_with_checked_register_claim} |
| Trong số bản nháp: có nhận định đối chiếu tài liệu | ${n.draft_with_checked_source_claim} |
| Trong số bản nháp: còn chờ nghiên cứu | ${n.draft_research_pending} |
| Nhận định ghi danh đối chiếu trong đợt này | ${n.checked_register_claims} |
| Nhận định từ tài liệu trong gói bổ sung | ${n.checked_source_claims} |
| Bài mới được công bố trong đợt này | 0 |

${n.checked_register_claims} nhận định ghi danh không phải ${n.checked_register_claims} bài mới. Có ${n.checked_register_claims - n.draft_with_checked_register_claim} mục đã có bài công bố, ${n.draft_with_checked_register_claim} mục còn nháp.
SQLite local vẫn theo dõi 40 mục workbook; số liệu từ view của SQLite có phạm vi riêng.
Không cộng số đã đối chiếu của hai kho vì có ID trùng nhau.

## Chứng minh ghi danh

Nguồn: [Cục Di sản văn hóa](${review.sources.find(source => source.id === 'S04').url}).
Địa danh giữ theo thời kỳ ghi danh. Chưa đối chiếu bản quét quyết định gốc.

| ID | Mục danh sách | Quyết định | Ngày | Trạng thái bài |
|---|---:|---|---|---|
${review.records.map(record => `| ${record.content_id} | ${record.register_number} | ${record.decision_number} | ${record.decision_date} | ${ledger.items.find(item => item.id === record.content_id).publication_status} |`).join('\n')}

Lưu ý dữ liệu: dòng 360 (bánh pía) có cột loại hình chưa phù hợp với tên nghề.
Gói không dùng cột đó làm phân loại chuẩn và không suy rộng sang nghề lạp xưởng.
Các mục cùng tên ở Cần Giờ, Sông Đốc hoặc An Giang không được ghép với Sóc Trăng.

## Hồ sơ đối chiếu tài liệu

| ID | Nhận định | Nguồn và vị trí | Phạm vi |
|---|---|---|---|
${sourceReviews.flatMap(pack => pack.records.flatMap(record => claimsForRecord(record).map(claim => {
  const source = pack.sources.find(source => source.id === claim.source_id);
  return `| ${record.content_id} | ${claim.statement} | [${claim.source_id}](${source.url}) — ${claim.locator} | ${claim.scope} |`;
}))).join('\n')}

Ba Láng và Phong Điền mới có chứng cứ tên xuất hiện, chưa xác định từ nguyên.
Phần cúng tổ tiên là ngữ cảnh từ văn bản lịch sử, chưa phải khảo sát đại diện Nam Bộ hiện nay.
Chùa Khmer mới đối chiếu tóm tắt nghiên cứu; không gắn số trang toàn văn giả.
E006/E007 vẫn là đầu mối thư mục vì chưa đọc được toàn văn gốc. Không chép lời ca, văn cúng hoặc ảnh báo chí.

## Công việc còn lại theo từng bản nháp

| ID | Hồ sơ | Chứng minh hiện có | Việc tiếp theo |
|---|---|---|---|
${drafts.map(item => `| ${item.id} | ${item.title} | ${item.verification === 'register_claim_only' ? 'Chỉ metadata ghi danh' : item.verification === 'source_claim_only' ? 'Nhận định có giới hạn; còn nháp' : 'Chưa đủ'} | ${item.next_action} |`).join('\n')}

## Quyền, ETL và tọa độ

- [Dataset Du lịch 2026](https://data.cantho.gov.vn/dataset/du-lieu-ve-du-lich-2026) chưa cấp giấy phép.
- [Điều khoản cổng](https://data.cantho.gov.vn/pages/dieu_khoan_su_dung) yêu cầu chấp thuận bằng văn bản; chưa có chấp thuận cho dự án.
- Resource lịch sử xác định từ liên kết: \`6dbd782b-9db8-4605-aa1c-21d1d4309a3a\`; trang resource chưa đọc được, chưa có schema hay URL tải được xác minh.
- [Resource di tích](https://data.cantho.gov.vn/dataset/du-lieu-cac-di-tich-lich-su-van-hoa/resource/e6ddcfdf-7886-40d3-ad3a-3ce21648c952?inner_span=True) ghi Other (Non-Commercial), Paid data True, định dạng chưa rõ.
- Không tải XLSX, ảnh báo chí hoặc bản thu; chưa tạo clearance cho tài sản nguồn. Chỉ lưu metadata và nhận xét mới có ghi nguồn.
- [OSM](https://www.openstreetmap.org/copyright) là căn cứ giấy phép dữ liệu địa lý, không chứng minh lịch sử. Chưa duyệt thêm tọa độ hoặc sửa tour.

## Tái tạo và nhập có kiểm soát

\`npm run data:validate\` kiểm tra gói và xuất số lượng, không ghi DB.
\`npm run data:report\` tạo báo cáo này và ledger JSON/CSV trong \`outputs/research-review\`.

\`python scripts/import-research-review.py --db "E:/Nam bộ ký sự/data/research.sqlite"\` mặc định chỉ thử rồi rollback.
Thêm \`--apply\` để nhập sau kiểm tra: tự sao lưu SQLite, transaction nguyên khối và từ chối ghi đè phiên bản đã nhập.
Không lệnh nào đặt trạng thái approved/published, cấp quyền tài sản hoặc đổi nội dung website.
Gói bổ sung được nhập riêng bằng cùng script với \`--review data/research/source-review-2026-10-28.json\`.
Bản nháp văn bản nằm trong JSON để biên tập; SQLite chỉ nhập chứng minh và metadata, chưa nhập asset văn bản hay cấp quyền công bố.
`;
}

export async function main(args = process.argv.slice(2)) {
  assert.ok(args.every(arg => ['--report'].includes(arg)), 'Only --report is supported');
  const inputs = await loadInputs();
  const ledger = createLedger(inputs);
  if (args.includes('--report')) {
    const output = new URL('outputs/research-review/', root);
    await mkdir(output, { recursive: true });
    await writeFile(new URL('ledger.json', output), JSON.stringify(ledger, null, 2) + '\n');
    const columns = Object.keys(ledger.items[0]);
    const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    await writeFile(new URL('ledger.csv', output), '\uFEFF' + [columns, ...ledger.items.map(item => columns.map(key => item[key]))].map(row => row.map(quote).join(',')).join('\n') + '\n');
    await writeFile(new URL('docs/research-progress.md', root), renderReport(ledger, inputs.review, inputs.sourceReviews));
  }
  console.log(JSON.stringify(ledger.counts, null, 2));
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
