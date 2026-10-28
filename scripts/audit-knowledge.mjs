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
  const metadata = JSON.parse(await readFile(new URL('data/knowledge/metadata.json', root), 'utf8'));
  const samples = JSON.parse(await readFile(new URL('data/knowledge/samples.json', root), 'utf8'));
  const ids = new Set(ledger.items.filter(item => item.publication_status === 'published').map(item => item.id));
  const articles = [...inputs.bundle.articles, ...inputs.expansion.articles].filter(article => ids.has(article.id));
  const sourceIds = new Set([...inputs.seed.sources, ...inputs.bundle.sources, ...inputs.expansion.sources, ...[inputs.review, ...inputs.sourceReviews].flatMap(pack => pack.sources)].map(source => source.id));
  const registerClaims = new Map(inputs.review.records.flatMap(claimsForRecord).map(claim => [claim.claim_id, claim]));
  return { inputs, ledger, metadata, samples, articles, context: { articles, sourceIds, registerClaims } };
}
export function auditKnowledge({ inputs, ledger, metadata, samples, context }) {
  const checked = validateKnowledge(metadata, samples, context);
  const bindings = Object.values(metadata.bindings);
  const allRecords = new Map(inputs.seed.contents.map(item => [item.id, { id: item.id, name: item.title, entity_type: item.category }]));
  for (const item of [...inputs.bundle.articles, ...inputs.expansion.articles]) allRecords.set(item.id, { id: item.id, name: metadata.bindings[item.id]?.name ?? item.title, entity_type: metadata.bindings[item.id]?.entity_type ?? item.category, aliases: (metadata.bindings[item.id]?.aliases ?? []).filter(alias => ['alternate_name', 'historical_name'].includes(alias.kind)).map(alias => alias.value) });
  for (const item of samples.samples) allRecords.set(item.id, { id: item.id, name: item.title, entity_type: item.entity_type });
  return { reviewed_at: metadata.reviewed_at, ...checked,
    counts: { public_articles: ledger.counts.published, existing_drafts: ledger.counts.draft, sample_drafts: samples.samples.length, total_tracked: allRecords.size, publication_eligible: ledger.counts.publication_eligible, newly_published: 0, public_sources: ledger.counts.registered_sources, research_sources_before: ledger.counts.research_sources, staged_sample_sources: samples.sources.length, source_union: new Set([...context.sourceIds, ...samples.sources.map(source => source.id)]).size },
    domains: knowledgeDomains.map(domain => ({ ...domain, public_count: bindings.filter(item => [item.primary_domain, ...item.secondary_domains].includes(domain.id)).length, sample_count: samples.samples.filter(item => [item.primary_domain, ...item.secondary_domains].includes(domain.id)).length })),
    regions: knowledgeRegions.map(region => ({ ...region, public_count: bindings.filter(item => item.regions.includes(region.id)).length, sample_count: samples.samples.filter(item => item.regions.includes(region.id)).length })),
    communities: knowledgeCommunities.map(community => ({ ...community, public_count: bindings.filter(item => item.communities.includes(community.id)).length, sample_count: samples.samples.filter(item => item.communities.includes(community.id)).length })),
    unassigned_region: bindings.filter(item => !item.regions.length).length,
    unassigned_community: bindings.filter(item => !item.communities.length).length,
    duplicate_candidates: duplicateCandidates([...allRecords.values()]),
    database_action: 'proposal_only_not_applied', publication_action: 'none',
  };
}
async function report(data, audit) {
  const output = new URL('outputs/knowledge/', root); await mkdir(output, { recursive: true });
  const hashes = Object.fromEntries(await Promise.all(['data/knowledge/metadata.json', 'data/knowledge/samples.json'].map(async file => [file, createHash('sha256').update(await readFile(new URL(file, root))).digest('hex')])));
  await writeFile(new URL('audit.json', output), JSON.stringify({ ...audit, hashes }, null, 2) + '\n');
  const table = rows => '| Nhóm | Công khai | Mẫu nháp |\n|---|---:|---:|\n' + rows.map(row => `| ${row.name} | ${row.public_count} | ${row.sample_count} |`).join('\n');
  const doc = `# Audit hệ thống tri thức — ${audit.reviewed_at}\n\n${audit.counts.public_articles} hồ sơ đã đối chiếu nguồn và đang công khai; ${audit.counts.existing_drafts} bản nháp cũ; ${audit.counts.sample_drafts} mẫu mới có nhận định được đối chiếu nhưng chưa duyệt bài/quyền công bố. Tổng ${audit.counts.total_tracked} ID, ${audit.counts.existing_drafts + audit.counts.sample_drafts} bản nháp. Đủ điều kiện công bố theo snapshot hiện có: ${audit.counts.publication_eligible}; công bố mới: 0. Không đồng nhất nhận định được kiểm tra với một bài đã hoàn tất thẩm định.\n\n${audit.counts.public_sources} nguồn trong snapshot công khai; ${audit.counts.research_sources_before} nguồn duy nhất trước đợt này; ${audit.counts.staged_sample_sources} nguồn mẫu mới chỉ được lưu trong gói biên tập; hợp ${audit.counts.source_union}. Chưa nhập ba mẫu vào SQLite hoặc API công khai.\n\n## Schema hiện tại\n\nD1/Drizzle có cultural_contents, source_registry, source_citations, entity_relationships, dialect_entries, media_assets và cổng xét quyền/nguồn. category, historical_area, community còn là chuỗi; chưa biểu diễn đa lĩnh vực, dị danh có loại, địa giới theo thời kỳ hoặc độ chính xác của mốc thời gian. SQLite nghiên cứu ở thư mục cha là schema khác (source_registry/editorial_queue); vẫn 40 mục, 15 mục có nhận định được đối chiếu, 25 chờ, 0 đủ điều kiện công bố. Không áp dụng SQL D1 lên kho này.\n\n## Mức bao phủ theo lĩnh vực\n\n${table(audit.domains)}\n\nMột bài có thể thuộc nhiều lĩnh vực nên không cộng các dòng để tính số bài.\n\n## Địa bàn tư liệu\n\n${table(audit.regions)}\n\n${audit.unassigned_region} hồ sơ chưa gắn vùng riêng. Nơi xuất bản không được xem là nguồn gốc thực hành.\n\n## Cộng đồng được nguồn nêu\n\n${table(audit.communities)}\n\n${audit.unassigned_community} hồ sơ chưa gắn nhãn cộng đồng. Đây là khoảng trống metadata, không kết luận cộng đồng vắng mặt. Kinh, Khmer, Hoa, Chăm không phải danh sách đóng; nhóm khác cần tên tự nhận và nguồn cụ thể khi mở rộng.\n\n## Trùng lặp và tên gọi\n\n${audit.duplicate_candidates.length} cặp trùng tên chuẩn hóa/dị danh cần đọc tay, không tự gộp. Báo cáo máy ở outputs/knowledge/audit.json. Khác loại thực thể (địa danh/chợ/lễ hội) vẫn giữ ID riêng. Các từ khóa giả thuyết như cà ràng không được đưa vào tập dị danh tương đương.\n\n## Phạm vi kiểm chứng\n\n25 ánh xạ có nguồn đã gắn với bài; 6 mốc có độ chính xác năm/ngày và loại mốc riêng; 3 mẫu có 7 câu hỏi, tổng 6 nhận định nguồn trực tiếp. Chưa đối chiếu địa giới hiện hành, không thêm tọa độ, bản thu hoặc ảnh nguồn chưa có quyền. SQL tại docs/database/knowledge-extension.sql chỉ là đề xuất bổ sung, chưa được áp dụng.\n\n## Mẫu biên tập\n\n${data.samples.samples.map(sample => `- **${sample.title}** — draft; nguồn: ${sample.claims.map(claim => data.samples.sources.find(source => source.id === claim.source_id)).filter((source, index, list) => list.findIndex(other => other.id === source.id) === index).map(source => `[${source.publisher}](${source.url})`).join(', ')}. Không phê duyệt công bố.`).join('\n')}\n`;
  await writeFile(new URL('docs/knowledge-audit.md', root), doc);
  const dossiers = '# Hồ sơ mẫu — chỉ dùng thẩm định, chưa công bố\n\n' + data.samples.samples.map(sample => `## ${sample.title}\n\nID: ${sample.id}; draft; chưa duyệt xuất bản; 0 ảnh, 0 âm thanh.\n\n${editorialQuestions.map(question => `### ${question.label}\n\n[${sample.answers[question.id].state}] ${sample.answers[question.id].text}\n\nChứng minh: ${sample.answers[question.id].claim_ids.join(', ') || 'chưa có'}`).join('\n\n')}\n\n### Nhận định và nguồn\n\n${sample.claims.map(claim => `- ${claim.id}: ${claim.statement} — [${claim.source_id}](${data.samples.sources.find(source => source.id === claim.source_id).url}), ${claim.locator}; loại ${claim.kind}.`).join('\n')}\n\n### Quyền và khoảng trống\n\n${sample.rights_basis}\n\n${sample.research_gaps.map(gap => `- ${gap}`).join('\n')}`).join('\n\n');
  await writeFile(new URL('sample-dossiers.md', output), dossiers + '\n');
  const priorities = 'domain,priority,topic,status\n' + audit.domains.flatMap(domain => domain.topics.map(topic => [domain.id, domain.priority, topic, 'proposed_not_verified'].map(value => `"${value.replaceAll('"', '""')}"`).join(','))).join('\n');
  await writeFile(new URL('priority-backlog.csv', output), '\uFEFF' + priorities + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const data = await loadKnowledgeInputs(); const audit = auditKnowledge(data);
  if (process.argv.includes('--report')) await report(data, audit);
  console.log(JSON.stringify({ counts: audit.counts, domains: audit.domains.length, events: audit.timeline_events, sample_claims: audit.sample_claims, duplicates: audit.duplicate_candidates.length, database_action: audit.database_action }, null, 2));
}
