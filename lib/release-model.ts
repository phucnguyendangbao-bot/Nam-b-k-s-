import type { ArticleSection } from './editorial-model';
import type { KnowledgeBinding } from './knowledge-core';
import type { KnowledgeEvent } from './knowledge-core';

export type ReleaseLocation = { id: string; content_id: string; lat: number; lng: number; theme: 'ecology' | 'archaeology' | 'worship' | 'river' | 'craft' | 'arts'; status: 'proposed'; provenance: string };

/**
 * Một kỳ tổ chức cụ thể của lễ hội (khác với hồ sơ lễ thức). Ngày luôn đi kèm nguồn và trạng thái:
 * - `reported`: đã diễn ra, có bài tường thuật;
 * - `announced`: đơn vị tổ chức hoặc cơ quan quản lý đã công bố kế hoạch (có thể vẫn là "dự kiến");
 * - `listed`: có trên lịch sự kiện chính thức, chưa thấy thông báo riêng của ban tổ chức;
 * - `traditional`: chỉ có lịch âm truyền thống; ngày dương lịch là quy đổi của ban biên tập (`estimate_note`).
 */
export type OccurrenceStatus = 'reported' | 'announced' | 'listed' | 'traditional';
export type FestivalOccurrence = {
  id: string; content_id: string; related_ids: string[]; name: string; edition: string;
  place_as_written: string; place_id: string | null; region: 'dong-nam-bo' | 'tay-nam-bo' | 'lien-vung';
  start: string; end: string; lunar: { start: [number, number]; end: [number, number]; year: string };
  date_status: OccurrenceStatus; source_ids: string[]; locator: string; source_as_written: string; why: string;
  note?: string; estimate_note?: string;
};

export type ReleaseAnswer = { state: 'supported' | 'partial' | 'unknown'; text: string; source_ids: string[] };
export type ReleaseArticle = {
  id: string; title: string; category: string; kind: string; topic: string; historical_area: string; community: string;
  summary: string; introduction: string; body: string; scope_note: string; classification: string;
  sections: ArticleSection[]; claims: { source_id: string; statement: string; locator: string; kind: string; review_status: string; reviewer: string; checked_at: string }[];
  knowledge: KnowledgeBinding; answers: Record<string, ReleaseAnswer>;
  media: { id: string; kind: string; url: string; author: string; source_url: string; license_name: string; license_url: string; modifications: string; caption: string; attribution: string; commercial_allowed: number; file_sha256: string; rights_review: string; width: number; height: number }[];
  publication_status: string; review_status: string; rights_review_status: string; publish_approval: boolean; reviewed_at: string; rights_basis: string;
  dialect?: { headword: string; meaning: string; usage_context: string; example: string; example_note: string; regional_scope: string; part_of_speech: string; audio_asset_id: null };
  dialect_clearance?: { status: string; reviewer: string; checked_at: string; source_ids: string[]; example_origin: string; audio_cleared: boolean };
};
export type PublicationApproval = { status: string; authority: string; reviewer: string; reviewed_at: string; authorization: string; approved_article_ids: string[]; approved_tour_ids: string[]; approved_dialect_ids?: string[]; approved_occurrence_ids?: string[]; release_sha256: string; release_payload_sha256: string };
export type ReleaseData = { version: string; reviewed_at: string; sources: { id: string; name: string; url: string; publisher: string; source_type: string; source_version: string; license_reported: string; rights: string; consulted_extent?: string }[]; articles: ReleaseArticle[]; tours: { id: string; title: string; kind: string; description: string; content_ids: string[] }[]; events?: KnowledgeEvent[]; locations?: ReleaseLocation[]; occurrences?: FestivalOccurrence[] };

/** Dialect additions require a named clearance, separate from general article review. */
export function canReleaseDialect(article: ReleaseArticle, approval: PublicationApproval): boolean {
  if (!article.dialect) return !article.dialect_clearance;
  const d = article.dialect, review = article.dialect_clearance;
  return Boolean(approval.approved_dialect_ids?.includes(article.id) && article.kind === 'dialect'
    && review?.status === 'accepted' && review.reviewer === approval.reviewer && review.checked_at === approval.reviewed_at
    && review.example_origin === 'editorial' && review.audio_cleared === false && d.audio_asset_id === null
    && [d.headword, d.meaning, d.usage_context, d.example, d.example_note, d.regional_scope, d.part_of_speech].every(value => value?.trim())
    && review.source_ids.length > 0 && review.source_ids.every(id => article.claims.some(claim => claim.source_id === id)));
}

/** Publication is an explicit decision for named records, independent of research metadata. */
export function canReleaseArticle(article: ReleaseArticle, approval: PublicationApproval, sourceIds: Set<string>): boolean {
  return approval.status === 'approved' && approval.authority === 'owner_delegation' && Boolean(approval.authorization?.trim())
    && canReleaseDialect(article, approval)
    && approval.approved_article_ids.includes(article.id) && article.publish_approval === true
    && article.publication_status === 'published' && article.review_status === 'verified' && article.rights_review_status === 'cleared'
    && Boolean(article.rights_basis?.trim()) && article.claims.length > 0
    && article.claims.every(claim => sourceIds.has(claim.source_id) && claim.review_status === 'accepted' && claim.reviewer === approval.reviewer && Boolean(claim.statement?.trim()) && Boolean(claim.locator?.trim()) && claim.checked_at === approval.reviewed_at)
    && article.sections.length > 0 && article.sections.every(section => section.sourceIds.length > 0 && section.sourceIds.every(id => article.claims.some(claim => claim.source_id === id)))
    && article.media.every(asset => asset.rights_review === 'accepted' && asset.commercial_allowed === 1);
}
