import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { loadInputs, createLedger, claimsForRecord } from './research-data.mjs';
import { validateKnowledge, duplicateCandidates } from '../lib/knowledge-core.ts';
import { knowledgeDomains, knowledgeRegions, knowledgeCommunities, editorialQuestions } from '../lib/knowledge-taxonomy.ts';

const root = new URL('../', import.meta.url);
export async function loadKnowledgeInputs() {
  const inputs = await loadInputs();
  const ledger = createLedger(inputs);
  const originalMetadata = JSON.parse(await readFile(new URL('data/knowledge/metadata.json', root), 'utf8'));
  const metadata = { ...originalMetadata, bindings: { ...originalMetadata.bindings, ...Object.fromEntries(inputs.release.articles.map(article => [article.id, article.knowledge])) } };
  const samples = JSON.parse(await readFile(new URL('data/knowledge/samples.json', root), 'utf8'));
  const ids = new Set(ledger.items.filter(item => item.publication_status === 'published').map(item => item.id));
  const articles = [...inputs.bundle.articles, ...inputs.expansion.articles].filter(article => ids.has(article.id));
  const sourceIds = new Set([...inputs.seed.sources, ...inputs.bundle.sources, ...inputs.expansion.sources, ...[inputs.review, ...inputs.sourceReviews].flatMap(pack => pack.sources)].map(source => source.id));
  const registerClaims = new Map(inputs.review.records.flatMap(claimsForRecord).map(claim => [claim.claim_id, claim]));
  const releasedSampleIds = new Set(samples.samples.filter(sample => inputs.release.articles.some(article => article.id === sample.id)).map(sample => sample.id));
  return { inputs, ledger, metadata, samples, articles, context: { articles, sourceIds, registerClaims, releasedSampleIds } };
}
export function auditKnowledge({ inputs, ledger, metadata, samples, context }) {
  const checked = validateKnowledge(metadata, samples, context);
  const bindings = Object.values(metadata.bindings);
  const allRecords = new Map(inputs.seed.contents.map(item => [item.id, { id: item.id, name: item.title, entity_type: item.category }]));
  for (const item of [...inputs.bundle.articles, ...inputs.expansion.articles]) allRecords.set(item.id, { id: item.id, name: metadata.bindings[item.id]?.name ?? item.title, entity_type: metadata.bindings[item.id]?.entity_type ?? item.category, aliases: (metadata.bindings[item.id]?.aliases ?? []).filter(alias => ['alternate_name', 'historical_name'].includes(alias.kind)).map(alias => alias.value) });
  for (const item of samples.samples) if (!allRecords.has(item.id)) allRecords.set(item.id, { id: item.id, name: item.title, entity_type: item.entity_type });
  const draftSamples = samples.samples.filter(sample => !context.releasedSampleIds.has(sample.id));
  return { reviewed_at: metadata.reviewed_at, ...checked,
    counts: { public_articles: ledger.counts.published, existing_drafts: ledger.counts.draft, sample_drafts: draftSamples.length, promoted_samples: context.releasedSampleIds.size, total_tracked: allRecords.size, publication_eligible: ledger.counts.publication_eligible, newly_published: ledger.counts.newly_published, public_sources: ledger.counts.registered_sources, research_sources: ledger.counts.research_sources, staged_sample_sources: samples.sources.filter(source => !context.sourceIds.has(source.id)).length, source_union: new Set([...context.sourceIds, ...samples.sources.map(source => source.id)]).size },
    domains: knowledgeDomains.map(domain => ({ ...domain, public_count: bindings.filter(item => [item.primary_domain, ...item.secondary_domains].includes(domain.id)).length, sample_count: draftSamples.filter(item => [item.primary_domain, ...item.secondary_domains].includes(domain.id)).length })),
    regions: knowledgeRegions.map(region => ({ ...region, public_count: bindings.filter(item => item.regions.includes(region.id)).length, sample_count: draftSamples.filter(item => item.regions.includes(region.id)).length })),
    communities: knowledgeCommunities.map(community => ({ ...community, public_count: bindings.filter(item => item.communities.includes(community.id)).length, sample_count: draftSamples.filter(item => item.communities.includes(community.id)).length })),
    unassigned_region: bindings.filter(item => !item.regions.length).length,
    unassigned_community: bindings.filter(item => !item.communities.length).length,
    duplicate_candidates: duplicateCandidates([...allRecords.values()]),
    database_action: 'proposal_only_not_applied', publication_action: 'explicit_reviewed_release',
  };
}
async function report(data, audit) {
  const output = new URL('outputs/knowledge/', root); await mkdir(output, { recursive: true });
  const hashes = Object.fromEntries(await Promise.all(['data/knowledge/metadata.json', 'data/knowledge/samples.json'].map(async file => [file, createHash('sha256').update(await readFile(new URL(file, root))).digest('hex')])));
  await writeFile(new URL('audit.json', output), JSON.stringify({ ...audit, hashes }, null, 2) + '\n');
  const table = rows => '| Nhóm | Công khai | Mẫu nháp |\n|---|---:|---:|\n' + rows.map(row => `| ${row.name} | ${row.public_count} | ${row.sample_count} |`).join('\n');
  const doc = `# Audit hệ thống tri thức — ${audit.reviewed_at}

${audit.counts.public_articles} hồ sơ đã đối chiếu nguồn và đủ điều kiện công bố; ${audit.counts.existing_drafts} bản nháp chờ nghiên cứu. Tổng ${audit.counts.total_tracked} ID. Đợt được chủ dự án ủy quyền này thêm ${audit.counts.newly_published} bài đã duyệt và 3 hành trình đọc. Ba mẫu trước đây được thay bằng phiên bản công bố cùng ID, không tăng số lượng bằng bản sao.

${audit.counts.public_sources} nguồn trong snapshot công khai; ${audit.counts.source_union} nguồn duy nhất tính cả kho nghiên cứu. Có tên trong registry không đồng nghĩa mọi nội dung của nguồn đã được đọc hoặc mọi tài sản được phép tái sử dụng.

## Quyết định biên tập

Gói data/release/published-2026-10-28.json và publication-approval-2026-10-28.json ghi rõ từng ID được duyệt. Hash toàn tệp và payload, nguồn/locator từng nhận định, bảy câu hỏi, trạng thái quyền và hash ảnh đều được kiểm trước khi build. Không biến tất cả bản nháp hoặc mọi nguồn thư mục thành bài công khai.

${data.inputs.release.articles.map(article => `- **${article.id} — ${article.title}**: ${article.claims.length} nhận định; ${article.media.length} ảnh đã rà quyền; [nguồn chính](${data.inputs.release.sources.find(source => source.id === article.claims[0].source_id).url}).`).join('\n')}

## Bao phủ theo lĩnh vực

${table(audit.domains)}

Một bài có thể thuộc nhiều lĩnh vực; không cộng các dòng để tính tổng bài. Có hồ sơ trong một lĩnh vực không có nghĩa đã bao quát toàn bộ tri thức của lĩnh vực đó.

## Địa bàn và cộng đồng theo nguồn

${table(audit.regions)}

${table(audit.communities)}

${audit.unassigned_region} hồ sơ chưa gắn vùng riêng; ${audit.unassigned_community} hồ sơ chưa gắn nhãn cộng đồng. Đây là giới hạn tư liệu, không kết luận cộng đồng vắng mặt. Nơi in sách không được xem là nơi phát sinh câu tục ngữ. Tên cũ giữ riêng; địa giới hiện hành chưa đối chiếu vẫn để null.

## Chỗ chưa thể khẳng định

- Dốc Chùa: Cục DSVH ghi 1977, bài đăng lại trên BTLSQG ghi 1997; chưa có báo cáo khai quật gốc để giải quyết, không tạo mốc chắc chắn.
- Nguyễn Hữu Cảnh: chỉ dùng phạm vi 1698 đã đối chiếu bảo tàng và Đồng Nai; không chép các niên đại lỗi ngoài phạm vi bài.
- Nguyên Tiêu: phân biệt sự kiện 20/02 và 24/02/2024; không dùng như lịch lễ hội hiện tại.
- Châu Phong 2026: dự thảo phát triển du lịch, không phải bằng chứng dịch vụ đã hoạt động.
- Cần Giờ/Tràm Chim: mốc ghi danh và dữ liệu cũ không thay niên đại hình thành hoặc số liệu giám sát hiện nay.
- Đờn ca tài tử: UNESCO trực tiếp gặp human-verification khi đọc lại. Đã thay nhận định công khai bằng nguồn Cục DSVH/Bộ VHTTDL đọc được, tách ghi danh khỏi thực hành và kế hoạch 2022.
- ${audit.counts.existing_drafts} đầu mối còn lại tiếp tục là bản nháp, có công việc tiếp theo trong docs/research-progress.md. Nguồn thư mục, bài tóm tắt và metadata ghi danh chưa đủ thay toàn văn hoặc nghiên cứu riêng.

## Quyền và schema

Hai ảnh Commons mới dùng JPEG gốc (Cần Giờ: Tho nau, CC BY-SA3.0; Tràm Chim: trungydang, CC BY3.0), giữ nguồn, giấy phép, thay đổi và SHA-256. Ảnh trầu cau dùng lại asset public domain đã rà từ trước, có giới hạn chưa xác định địa phương chụp. Không lấy ảnh báo chí; bốn bài mới chưa có ảnh phù hợp được cấp quyền dùng nhãn thiếu ảnh rõ ràng. Không tạo bản thu, tọa độ hoặc tuyến thực địa mới.

SQL trong docs/database/knowledge-extension.sql vẫn là đề xuất cho D1, chưa áp dụng. Website Vercel đọc snapshot đã duyệt; SQLite nghiên cứu ở thư mục cha là kho khác, vẫn 40 mục workbook và không tự đổi trạng thái từ release web. ${audit.duplicate_candidates.length} cặp trùng tên/dị danh được phát hiện; mọi quyết định gộp cần người biên tập.
`;
  await writeFile(new URL('docs/knowledge-audit.md', root), doc);
  const dossiers = '# Hồ sơ mẫu gốc — lưu lịch sử biên tập; xem release để biết phiên bản công bố\n\n' + data.samples.samples.map(sample => `## ${sample.title}\n\nID: ${sample.id}; bản nháp gốc lưu lịch sử; phiên bản công bố cùng ID ở data/release. Bản gốc có 0 ảnh, 0 âm thanh.\n\n${editorialQuestions.map(question => `### ${question.label}\n\n[${sample.answers[question.id].state}] ${sample.answers[question.id].text}\n\nChứng minh: ${sample.answers[question.id].claim_ids.join(', ') || 'chưa có'}`).join('\n\n')}\n\n### Nhận định và nguồn\n\n${sample.claims.map(claim => `- ${claim.id}: ${claim.statement} — [${claim.source_id}](${data.samples.sources.find(source => source.id === claim.source_id).url}), ${claim.locator}; loại ${claim.kind}.`).join('\n')}\n\n### Quyền và khoảng trống\n\n${sample.rights_basis}\n\n${sample.research_gaps.map(gap => `- ${gap}`).join('\n')}`).join('\n\n');
  await writeFile(new URL('sample-dossiers.md', output), dossiers + '\n');
  const priorities = 'domain,priority,topic,status\n' + audit.domains.flatMap(domain => domain.topics.map(topic => [domain.id, domain.priority, topic, 'proposed_not_verified'].map(value => `"${value.replaceAll('"', '""')}"`).join(','))).join('\n');
  await writeFile(new URL('priority-backlog.csv', output), '\uFEFF' + priorities + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const data = await loadKnowledgeInputs(); const audit = auditKnowledge(data);
  if (process.argv.includes('--report')) await report(data, audit);
  console.log(JSON.stringify({ counts: audit.counts, domains: audit.domains.length, events: audit.timeline_events, sample_claims: audit.sample_claims, duplicates: audit.duplicate_candidates.length, database_action: audit.database_action }, null, 2));
}
