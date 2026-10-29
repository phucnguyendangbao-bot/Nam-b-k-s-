import { createHash } from 'node:crypto';
import document from '@/data/release/published-2026-10-28.json';
import decision from '@/data/release/publication-approval-2026-10-28.json';
import { canReleaseArticle } from './release-model';
import type { PublicationApproval, ReleaseData } from './release-model';

export const publicationApproval = decision as PublicationApproval;
const release = document as unknown as ReleaseData;
if (createHash('sha256').update(JSON.stringify(document)).digest('hex') !== publicationApproval.release_payload_sha256) throw new Error('Reviewed release payload has changed; source and rights review must be repeated.');
const sourceIds = new Set(release.sources.map(source => source.id));
if (!release.articles.every(article => canReleaseArticle(article, publicationApproval, sourceIds))) throw new Error('Release contains an unapproved article.');
export const reviewedRelease = release;
