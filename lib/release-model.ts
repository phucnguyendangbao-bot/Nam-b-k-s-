import type { ArticleSection } from './editorial-model';
import type { KnowledgeBinding } from './knowledge-core';

export type ReleaseAnswer = { state: 'supported' | 'partial' | 'unknown'; text: string; source_ids: string[] };
export type ReleaseArticle = {
  id: string; title: string; category: string; kind: string; topic: string; historical_area: string; community: string;
  summary: string; introduction: string; body: string; scope_note: string; classification: string;
  sections: ArticleSection[]; claims: { source_id: string; statement: string; locator: string; kind: string; review_status: string; reviewer: string; checked_at: string }[];
  knowledge: KnowledgeBinding; answers: Record<string, ReleaseAnswer>;
  media: { id: string; kind: string; url: string; author: string; source_url: string; license_name: string; license_url: string; modifications: string; caption: string; attribution: string; commercial_allowed: number; file_sha256: string; rights_review: string; width: number; height: number }[];
  publication_status: string; review_status: string; rights_review_status: string; publish_approval: boolean; reviewed_at: string; rights_basis: string;
};
export type PublicationApproval = { status: string; authority: string; reviewer: string; reviewed_at: string; authorization: string; approved_article_ids: string[]; approved_tour_ids: string[]; release_sha256: string; release_payload_sha256: string };
export type ReleaseData = { version: string; reviewed_at: string; sources: { id: string; name: string; url: string; publisher: string; source_type: string; source_version: string; license_reported: string; rights: string; consulted_extent?: string }[]; articles: ReleaseArticle[]; tours: { id: string; title: string; kind: string; description: string; content_ids: string[] }[] };

/** Publication is an explicit decision for named records, independent of research metadata. */
export function canReleaseArticle(article: ReleaseArticle, approval: PublicationApproval, sourceIds: Set<string>): boolean {
  return approval.status === 'approved' && approval.authority === 'owner_delegation' && Boolean(approval.authorization?.trim())
    && approval.approved_article_ids.includes(article.id) && article.publish_approval === true
    && article.publication_status === 'published' && article.review_status === 'verified' && article.rights_review_status === 'cleared'
    && Boolean(article.rights_basis?.trim()) && article.claims.length > 0
    && article.claims.every(claim => sourceIds.has(claim.source_id) && claim.review_status === 'accepted' && claim.reviewer === approval.reviewer && Boolean(claim.statement?.trim()) && Boolean(claim.locator?.trim()) && claim.checked_at === approval.reviewed_at)
    && article.sections.length > 0 && article.sections.every(section => section.sourceIds.length > 0 && section.sourceIds.every(id => article.claims.some(claim => claim.source_id === id)))
    && article.media.every(asset => asset.rights_review === 'accepted' && asset.commercial_allowed === 1);
}
