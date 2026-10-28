import { knowledgeDomains, knowledgeRegions, knowledgeCommunities, normalizeKnowledge, editorialQuestions, factKindLabels } from './knowledge-taxonomy.ts';
import type { CommunityId, DomainId, RegionId, QuestionId } from './knowledge-taxonomy.ts';

export type NamedPlace = { name: string; role: 'area_as_recorded' | 'publication_place'; source_id: string; locator: string; as_of: string; valid_from: string | null; valid_to: string | null };
export type KnowledgeAlias = { value: string; kind: 'alternate_name' | 'historical_name' | 'related_term' | 'hypothesis_keyword'; source_id: string; locator: string };
export type KnowledgeBinding = {
  name: string; entity_type: string; primary_domain: DomainId; secondary_domains: DomainId[];
  regions: RegionId[]; communities: CommunityId[]; source_ids: string[]; aliases: KnowledgeAlias[];
  historical_places?: NamedPlace[];
  current_admin?: { name: string; source_id: string; locator: string; checked_at: string; valid_from: string | null } | null;
  origin_section?: number; change_section?: number;
};
export type KnowledgeEvent = { id: string; content_id: string; title: string; value: string; year: number; precision: 'year' | 'day'; kind: 'publication' | 'register' | 'observed_event'; source_id: string; locator: string; source_as_written: string; evidence_ref?: string; review_status: 'source_checked' | 'pending' };
export type KnowledgeQuestion = { id: string; question: string; content_id: string; use: 'scope_note' | 'section'; section_index?: number };
export type KnowledgeMetadata = { version: string; reviewed_at: string; scope: string; bindings: Record<string, KnowledgeBinding>; events: KnowledgeEvent[]; questions: KnowledgeQuestion[] };
export type KnowledgeSource = { id: string; name: string; url: string; publisher: string; source_version: string; checked_at: string; license_reported: string; rights_basis: string };
export type KnowledgeAnswer = { state: 'supported' | 'partial' | 'unknown'; text: string; claim_ids: string[] };
export type KnowledgeSample = {
  id: string; title: string; publication_status: 'draft'; review_status: 'source_checked'; primary_domain: DomainId;
  secondary_domains: DomainId[]; regions: RegionId[]; communities: CommunityId[]; entity_type: string;
  historical_places: NamedPlace[]; current_admin: null; aliases: KnowledgeAlias[];
  claims: { id: string; source_id: string; statement: string; locator: string; kind: string }[];
  answers: Record<QuestionId, KnowledgeAnswer>; media: []; audio_url: null; publish_approval: false;
  rights_basis: string; research_gaps: string[];
};
export type SamplePack = { version: string; reviewed_at: string; sources: KnowledgeSource[]; samples: KnowledgeSample[] };
export type KnowledgeFilter = { q?: string; domain?: string; region?: string; community?: string; type?: string };
export type KnowledgeItem = { id: string; title: string; slug: string; summary: string; body?: string; historical_area: string; community: string; content_kind: string; classification: string; meaning?: string | null; part_of_speech?: string | null; image_url?: string | null; image_author?: string | null; image_license?: string | null; image_source_url?: string | null; status: string; knowledge: KnowledgeBinding };

export function knowledgeSearchText(binding: KnowledgeBinding) {
  return normalizeKnowledge([binding.name, ...binding.aliases.map(alias => alias.value), ...(binding.historical_places ?? []).map(place => place.name), binding.current_admin?.name ?? '', ...binding.source_ids].join(' '));
}

export function filterKnowledge<T extends KnowledgeItem>(items: T[], filter: KnowledgeFilter): T[] {
  const tokens = normalizeKnowledge(filter.q ?? '').split(' ').filter(Boolean);
  return items.filter(item => {
    const meta = item.knowledge;
    if (item.status !== 'published') return false;
    if (filter.domain && ![meta.primary_domain, ...meta.secondary_domains].includes(filter.domain as DomainId)) return false;
    if (filter.region && !meta.regions.includes(filter.region as RegionId)) return false;
    if (filter.community && !meta.communities.includes(filter.community as CommunityId)) return false;
    if (filter.type && item.content_kind !== filter.type) return false;
    const hay = normalizeKnowledge(`${item.title} ${item.summary} ${item.meaning ?? ''} ${item.body ?? ''} ${item.historical_area} ${item.community} ${knowledgeSearchText(meta)}`);
    return tokens.every(token => hay.includes(token));
  });
}

/** These links express a reading relation, never historical influence or origin. */
export function relatedKnowledge<T extends KnowledgeItem>(item: T, items: T[], limit = 5) {
  return items.filter(other => other.id !== item.id && other.status === 'published').map(other => {
    const sourceIds = other.knowledge.source_ids.filter(id => item.knowledge.source_ids.includes(id));
    const sameDomain = [other.knowledge.primary_domain, ...other.knowledge.secondary_domains].some(id => [item.knowledge.primary_domain, ...item.knowledge.secondary_domains].includes(id));
    return { item: other, reason: sourceIds.length ? 'Chung nguồn tham khảo' : 'Cùng lĩnh vực để đọc tiếp', source_ids: sourceIds, score: sourceIds.length * 3 + Number(sameDomain) };
  }).filter(link => link.score > 0).sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, 'vi')).slice(0, limit);
}

export type DuplicateInput = { id: string; name: string; entity_type: string; aliases?: string[] };
export type DuplicateCandidate = { left: string; right: string; reason: 'same_normalized_name' | 'shared_alias'; decision: 'pending'; auto_merge: false };
export function duplicateCandidates(items: DuplicateInput[]): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (a.id === b.id) continue;
    const namesA = new Set([a.name, ...(a.aliases ?? [])].map(normalizeKnowledge).filter(Boolean));
    const shared = [b.name, ...(b.aliases ?? [])].map(normalizeKnowledge).filter(name => namesA.has(name));
    if (!shared.length) continue;
    candidates.push({ left: a.id, right: b.id, reason: a.entity_type === b.entity_type && normalizeKnowledge(a.name) === normalizeKnowledge(b.name) ? 'same_normalized_name' : 'shared_alias', decision: 'pending', auto_merge: false });
  }
  return candidates;
}

function need(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const text = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const https = (value: string) => { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; } };
const unique = (values: string[], label: string) => need(new Set(values).size === values.length, `Trùng ${label}`);

export function validateKnowledge(metadata: KnowledgeMetadata, samplePack: SamplePack, context: { articles: { id: string; claims: { source_id: string }[]; sections?: unknown[] }[]; sourceIds: Set<string>; registerClaims: Map<string, { content_id: string; source_id: string; decision_date: string }> }) {
  const domains = new Set<string>(knowledgeDomains.map(domain => domain.id));
  const regions = new Set<string>(knowledgeRegions.map(region => region.id));
  const communities = new Set<string>(knowledgeCommunities.map(community => community.id));
  const articles = new Map(context.articles.map(article => [article.id, article]));
  unique(samplePack.sources.map(source => source.id), 'nguồn mẫu');
  unique(samplePack.samples.map(sample => sample.id), 'hồ sơ mẫu');
  const newSourceIds = new Set(samplePack.sources.map(source => source.id));
  for (const source of samplePack.sources) need(https(source.url) && text(source.name) && text(source.publisher) && text(source.source_version) && text(source.checked_at) && text(source.rights_basis), `Nguồn mẫu thiếu provenance: ${source.id}`);
  const validateAxes = (meta: Pick<KnowledgeBinding, 'primary_domain' | 'secondary_domains' | 'regions' | 'communities'>) => {
    need(domains.has(meta.primary_domain) && meta.secondary_domains.every(domain => domains.has(domain)), 'Lĩnh vực ngoài taxonomy');
    unique([meta.primary_domain, ...meta.secondary_domains], 'lĩnh vực');
    need(meta.regions.every(region => regions.has(region)) && meta.communities.every(community => communities.has(community)), 'Vùng/cộng đồng ngoài taxonomy');
  };
  for (const [id, binding] of Object.entries(metadata.bindings)) {
    const article = articles.get(id);
    need(article, `Metadata mồ côi: ${id}`);
    validateAxes(binding);
    const articleSources = new Set(article.claims.map(claim => claim.source_id));
    need(binding.source_ids.length > 0 && binding.source_ids.every(source => context.sourceIds.has(source) && articleSources.has(source)), `Nguồn không gắn với bài: ${id}`);
    for (const alias of binding.aliases) need(text(alias.value) && text(alias.locator) && articleSources.has(alias.source_id) && ['alternate_name','historical_name','related_term','hypothesis_keyword'].includes(alias.kind), `Dị danh chưa có nguồn hoặc loại: ${id}`);
    for (const place of binding.historical_places ?? []) need(text(place.name) && text(place.as_of) && text(place.locator) && articleSources.has(place.source_id) && ['publication_place', 'area_as_recorded'].includes(place.role), `Địa bàn thiếu niên đại/vai trò: ${id}`);
    if (binding.current_admin) need(text(binding.current_admin.checked_at) && text(binding.current_admin.locator) && context.sourceIds.has(binding.current_admin.source_id), `Địa giới hiện hành chưa đối chiếu: ${id}`);
    for (const section of [binding.origin_section, binding.change_section]) if (section !== undefined) need(Number.isInteger(section) && section >= 0 && section < (article.sections?.length ?? 0), `Mục biên tập không tồn tại: ${id}`);
  }
  need(Object.keys(metadata.bindings).length === articles.size, 'Chưa ánh xạ đủ hồ sơ hiện có');
  unique(metadata.events.map(event => event.id), 'sự kiện');
  for (const event of metadata.events) {
    need(articles.has(event.content_id) && context.sourceIds.has(event.source_id) && text(event.locator) && text(event.source_as_written), `Mốc thiếu nguồn: ${event.id}`);
    need(Number.isInteger(event.year) && event.value.startsWith(String(event.year)), `Mốc sai năm: ${event.id}`);
    need(['publication','register','observed_event'].includes(event.kind) && ['year','day'].includes(event.precision), 'Loại hoặc độ chính xác mốc không hợp lệ');
    if (event.precision === 'year') need(/^\d{4}$/.test(event.value), 'Không tự thêm ngày cho mốc chỉ có năm');
    else need(/^\d{4}-\d{2}-\d{2}$/.test(event.value) && Number.isFinite(Date.parse(event.value)) && new Date(event.value).toISOString().slice(0, 10) === event.value, 'Ngày không hợp lệ');
    if (event.kind === 'register') {
      const claim = context.registerClaims.get(event.evidence_ref ?? '');
      need(claim?.content_id === event.content_id && claim.source_id === event.source_id && claim.decision_date === event.value, 'Mốc ghi danh không khớp chứng minh đã đối chiếu');
    } else need(articles.get(event.content_id)!.claims.some(claim => claim.source_id === event.source_id), 'Mốc phải dùng nguồn đã đối chiếu của bài');
  }
  for (const question of metadata.questions) {
    const article = articles.get(question.content_id);
    need(article && text(question.question), 'Câu hỏi trỏ tới hồ sơ không tồn tại');
    if (question.use === 'section') need(Number.isInteger(question.section_index) && question.section_index! >= 0 && question.section_index! < (article.sections?.length ?? 0), 'Câu hỏi trỏ tới mục không tồn tại');
  }
  const claimIds: string[] = [];
  for (const sample of samplePack.samples) {
    validateAxes(sample);
    need(!articles.has(sample.id) && sample.publication_status === 'draft' && sample.publish_approval === false, 'Hồ sơ mẫu không được tự công bố');
    need(sample.media.length === 0 && sample.audio_url === null, 'Ảnh/âm thanh cần quy trình quyền riêng');
    need(sample.current_admin === null, 'Mẫu chưa đối chiếu địa giới hiện hành');
    need(!('latitude' in sample) && !('longitude' in sample), 'Không tự tạo tọa độ mẫu');
    need(sample.claims.length > 0 && sample.research_gaps.length > 0 && text(sample.rights_basis), 'Mẫu thiếu nhận định, quyền hoặc khoảng trống nghiên cứu');
    const localClaims = new Set(sample.claims.map(claim => claim.id));
    const localSources = new Set(sample.claims.map(claim => claim.source_id));
    for (const place of sample.historical_places) need(localSources.has(place.source_id) && text(place.locator) && text(place.as_of) && text(place.name) && ['publication_place','area_as_recorded'].includes(place.role), 'Địa bàn mẫu thiếu nguồn hoặc vai trò');
    for (const claim of sample.claims) {
      need(newSourceIds.has(claim.source_id) && text(claim.locator) && text(claim.statement) && claim.kind in factKindLabels, 'Nhận định mẫu thiếu nguồn hoặc loại tư liệu');
      claimIds.push(claim.id);
    }
    for (const question of editorialQuestions) {
      const answer = sample.answers[question.id];
      need(answer && ['supported', 'partial', 'unknown'].includes(answer.state) && text(answer.text), `Mẫu thiếu câu hỏi ${question.id}`);
      need(answer.claim_ids.every(id => localClaims.has(id)), 'Câu trả lời tham chiếu chứng minh không tồn tại');
      if (answer.state !== 'unknown') need(answer.claim_ids.length > 0, 'Câu trả lời có dữ kiện nhưng không có chứng minh');
    }
  }
  unique(claimIds, 'nhận định mẫu');
  const unicode = (value: unknown): void => {
    if (typeof value === 'string') need(value === value.normalize('NFC') && !value.includes('\uFFFD'), 'Unicode tiếng Việt không hợp lệ');
    else if (Array.isArray(value)) value.forEach(unicode);
    else if (value && typeof value === 'object') Object.values(value).forEach(unicode);
  };
  unicode(metadata); unicode(samplePack);
  return { domains: domains.size, mapped_articles: articles.size, samples: samplePack.samples.length, sample_claims: claimIds.length, timeline_events: metadata.events.length };
}
