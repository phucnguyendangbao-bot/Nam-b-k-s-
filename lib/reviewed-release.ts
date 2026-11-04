import { createHash } from 'node:crypto';
import document from '@/data/release/published-2026-10-28.json';
import decision from '@/data/release/publication-approval-2026-10-28.json';
import enrichment from '@/data/release/published-2026-11-01.json';
import enrichmentDecision from '@/data/release/publication-approval-2026-11-01.json';
import supplement from '@/data/release/published-2026-11-01-supplement.json';
import supplementDecision from '@/data/release/publication-approval-2026-11-01-supplement.json';
import dossierEnrichment from '@/data/release/published-2026-11-02-enrichment.json';
import dossierEnrichmentDecision from '@/data/release/publication-approval-2026-11-02-enrichment.json';
import festivals from '@/data/release/published-2026-11-04-festivals.json';
import festivalsDecision from '@/data/release/publication-approval-2026-11-04-festivals.json';
import { canReleaseArticle } from './release-model';
import type { PublicationApproval, ReleaseArticle, ReleaseData } from './release-model';

/**
 * Các gói đã duyệt, xếp theo thời gian. Mỗi gói bị khóa bằng mã băm payload trong bản phê duyệt của chính nó;
 * gói sau có thể thay phiên bản của một hồ sơ cùng ID (bản làm dày nội dung), không sửa gói trước.
 */
const layers = [
  { release: document as unknown as ReleaseData, raw: document, approval: decision as PublicationApproval },
  { release: enrichment as unknown as ReleaseData, raw: enrichment, approval: enrichmentDecision as PublicationApproval },
  { release: supplement as unknown as ReleaseData, raw: supplement, approval: supplementDecision as PublicationApproval },
  { release: dossierEnrichment as unknown as ReleaseData, raw: dossierEnrichment, approval: dossierEnrichmentDecision as PublicationApproval },
  { release: festivals as unknown as ReleaseData, raw: festivals, approval: festivalsDecision as PublicationApproval },
];
for (const { release, raw, approval } of layers) {
  if (createHash('sha256').update(JSON.stringify(raw)).digest('hex') !== approval.release_payload_sha256) throw new Error(`Reviewed release ${release.version} payload has changed; source and rights review must be repeated.`);
  const sourceIds = new Set(release.sources.map(source => source.id));
  if (!release.articles.every(article => canReleaseArticle(article, approval, sourceIds))) throw new Error(`Release ${release.version} contains an unapproved article.`);
  if ((release.occurrences ?? []).some(o => !approval.approved_occurrence_ids?.includes(o.id))) throw new Error(`Release ${release.version} contains an unapproved festival date.`);
}

export const publicationApproval = layers[0].approval;
/** Bản phê duyệt của gói mới nhất có chứa hồ sơ này. */
export function approvalFor(id: string): PublicationApproval {
  for (let i = layers.length - 1; i >= 0; i--) if (layers[i].release.articles.some(article => article.id === id)) return layers[i].approval;
  return layers[0].approval;
}
const byId = new Map<string, ReleaseArticle>();
const sources = new Map<string, ReleaseData['sources'][number]>();
for (const { release } of layers) {
  for (const article of release.articles) byId.set(article.id, article);
  for (const source of release.sources) sources.set(source.id, source);
}
export const reviewedRelease: ReleaseData = {
  version: layers.map(layer => layer.release.version).join('+'), reviewed_at: layers.at(-1)!.release.reviewed_at,
  sources: [...sources.values()], articles: [...byId.values()], tours: layers.flatMap(layer => layer.release.tours),
  events: layers.flatMap(layer => layer.release.events ?? []), locations: layers.flatMap(layer => layer.release.locations ?? []),
  occurrences: layers.flatMap(layer => layer.release.occurrences ?? []),
};
