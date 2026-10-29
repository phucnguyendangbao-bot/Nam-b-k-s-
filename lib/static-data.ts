import bundleJson from './editorial-bundle.json';
import seedJson from './research-seed.json';
import { fold, similarity, slugify } from './catalog';
import { imagePathAllowed, nfc, permitsCommercialMedia } from './editorial-model';
import { contentExpansion } from './content-expansion';
import { publicationApproval, reviewedRelease } from './reviewed-release';
import { canReleaseArticle, type ReleaseArticle } from './release-model';

export const READ_ONLY_DEPLOYMENT = true;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

const originalBundle = bundleJson as unknown as { reviewed_at: string; sources: Row[]; articles: Row[]; tours: Row[] };
const bundle = { reviewed_at: contentExpansion.reviewed_at,
  sources: [...originalBundle.sources, ...contentExpansion.sources, ...reviewedRelease.sources],
  articles: [...originalBundle.articles, ...contentExpansion.articles, ...reviewedRelease.articles] as Row[],
  tours: [...originalBundle.tours, ...contentExpansion.tours, ...reviewedRelease.tours] as Row[],
};
const seed = seedJson as unknown as { sources: Row[]; contents: Row[]; links: Row[] };

const articleSlugs: Record<string, string> = {
  E001: 'le-dam-ngo-coi-mat-e001', E008: 'gio-tien-thuong-va-gio-chinh-e008', E020: 'dau-sau-e020',
  E021: 'cai-rang-e021', E029: 'bau-e029', E030: 'qua-e030', E031: 'man-e031', E032: 'ben-e032', E033: 'hong-e033',
  'NBS-BINH-THUY': 'nha-co-binh-thuy-doc-kien-truc-va-nep-nha-nbs-binh-thuy',
  'NBS-CHO-NOI': 'cho-noi-cai-rang-mot-khong-gian-van-hoa-song-nuoc-nbs-cho-noi',
};
const tourSlugs: Record<string, string> = {
  'NBS-DOC-TEN-DAT': 'doc-ten-dat-qua-nhung-gia-thuyet-nbs-doc-ten-dat',
  'NBS-DOC-NEP-NHA': 'nep-nha-qua-tu-lieu-va-loi-ke-nbs-doc-nep-nha',
  'NBS-DOC-TIENG-QUE': 'nhung-cach-xung-ho-va-loi-noi-phuong-ngu-nbs-doc-tieng-que',
};

const displayRow = (row: Row): Row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === 'string' ? nfc(value) : value]));
const registeredSourceIds = new Set([...seed.sources, ...bundle.sources].map(source => source.id));
// The original eleven records were explicitly approved by the owner on 27 October.
// New records must pass the snapshot review gate; draft metadata never becomes public.
const ownerApprovedIds = new Set(Object.keys(articleSlugs));
const previousReleaseIds = new Set(['NBS-NINH-KIEU','E004','E010','E011','E012','E013','E018','E014','E027','NBS-TUCNGU-18','NBS-TUCNGU-22','NBS-TU-VAY','NBS-TU-VO','NBS-TU-NGHEN']);
const newReleaseIds = new Set(reviewedRelease.articles.map(article => article.id));
function canPublish(article: Row): boolean {
  const approved = ownerApprovedIds.has(article.id) || (previousReleaseIds.has(article.id) && article.publication_status === 'published'
    && article.review_status === 'verified' && article.rights_review_status === 'cleared')
    || (newReleaseIds.has(article.id) && canReleaseArticle(article as ReleaseArticle, publicationApproval, registeredSourceIds));
  const claims = (article.claims ?? []) as Row[];
  const sections = (article.sections ?? []) as Row[];
  const assets = (article.media ?? []) as Row[];
  return approved && claims.length > 0 && claims.every(claim => registeredSourceIds.has(claim.source_id) && claim.statement && claim.locator)
    && sections.every(section => section.sourceIds?.length > 0 && section.sourceIds.every((id: string) => registeredSourceIds.has(id)))
    && assets.every(asset => imagePathAllowed(asset.url) && asset.commercial_allowed === 1
      && asset.author && asset.source_url && asset.modifications && permitsCommercialMedia(asset.license_name, asset.license_url));
}
const approvedArticles = bundle.articles.filter(canPublish);
const articles: Row[] = approvedArticles.map(article => {
  const dialect = article.dialect as Row | undefined;
  const cover = ((article.media ?? []) as Row[]).find(item => item.kind === 'image');
  return displayRow({
    ...article,
    slug: articleSlugs[article.id] ?? article.slug ?? `${slugify(article.title)}-${String(article.id).toLowerCase()}`,
    content_kind: article.kind === 'dialect' ? 'dialect' : article.kind,
    classification: article.classification ?? 'source_supported', status: 'published', cms_status: 'published', revision: 1,
    sections_json: JSON.stringify(article.sections ?? []),
    updated_at: `${article.reviewed_at ?? originalBundle.reviewed_at}T00:00:00+07:00`, created_at: `${article.reviewed_at ?? originalBundle.reviewed_at}T00:00:00+07:00`,
    geo_reviewed: 0, latitude: null, longitude: null, eligible: 1,
    image_url: cover?.url ?? null, image_author: cover?.author ?? null,
    image_license: cover?.license_name ?? null, image_source_url: cover?.source_url ?? null,
    meaning: dialect?.meaning ?? null, usage_context: dialect?.usage_context ?? null, part_of_speech: dialect?.part_of_speech ?? null,
  });
});
const articleById = new Map(articles.map(article => [article.id, article]));
const media: Row[] = approvedArticles.flatMap(article => ((article.media ?? []) as Row[]).map(item => displayRow({ ...item, id: `${article.id}-${item.id}`, content_id: article.id, review_status: 'accepted' })));
const dialects: Row[] = approvedArticles.filter(article => article.dialect).map(article => displayRow({ id: `dialect-${article.id}`, content_id: article.id, ...article.dialect }));

const sourceMap = new Map<string, Row>();
for (const source of [...seed.sources, ...bundle.sources]) sourceMap.set(source.id, displayRow({ ...(sourceMap.get(source.id) ?? {}), ...source }));
const sources = [...sourceMap.values()].sort((a, b) => String(a.id).localeCompare(String(b.id)));
const citations: Row[] = approvedArticles.flatMap(article => ((article.claims ?? []) as Row[]).map((claim, index) => {
  const source = sourceMap.get(claim.source_id) ?? {};
  return displayRow({ id: claim.id ?? `${article.id}-${index + 1}`, content_id: article.id, source_id: claim.source_id,
    statement: claim.statement, locator: claim.locator, claim_kind: claim.kind, source_name: source.name, source_url: source.url,
    source_version: claim.source_version ?? source.source_version ?? `Bản đối chiếu ${article.reviewed_at ?? originalBundle.reviewed_at}`,
    review_note: claim.review_note ?? source.rights,
    license_reported: source.license_reported ?? source.license ?? 'unknown', source_type: source.source_type });
}));
const approvedTours = bundle.tours.filter(tour => tour.kind === 'digital' && tour.content_ids.length > 0 && tour.content_ids.every((id: string) => articleById.has(id)));
const tours: Row[] = approvedTours.map(tour => displayRow({ ...tour,
  slug: tourSlugs[tour.id] ?? tour.slug ?? `${slugify(tour.title)}-${String(tour.id).toLowerCase()}`,
  status: 'published', stop_count: (tour.content_ids ?? []).length, created_at: `${bundle.reviewed_at}T00:00:00+07:00` }));
const tourStopRows: Row[] = approvedTours.flatMap(tour => ((tour.content_ids ?? []) as string[]).map((contentId, index) => ({
  id: `${tour.id}-${index + 1}`, stop_id: `${tour.id}-${index + 1}`, tour_id: tour.id, content_id: contentId, position: index + 1,
})));

const normalizedSql = (sql: string) => sql.replace(/\s+/g, ' ').trim().toLowerCase();
function matchesText(row: Row, query: string) {
  const q = fold(query);
  const text = fold([row.title, row.summary, row.body, row.meaning, row.usage_context].filter(Boolean).join(' '));
  return text.includes(q) ? 2 : similarity(String(row.title ?? ''), q);
}

export async function ensureSeed() { /* Bundled at build time. */ }
export async function viewer(): Promise<Row | null> { return null; }
export const timestamp = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();
export const publicWhere = 'read_only_reviewed_snapshot';
const readOnlyError = (): never => { throw new Error('Bản Vercel chỉ cho phép đọc. Hãy biên tập dữ liệu trong kho GitHub.'); };
export function database(): D1Database { return readOnlyError(); }
export async function run(...args: unknown[]) { void args; return readOnlyError(); }
export async function batch(...args: unknown[]) { void args; return readOnlyError(); }
export async function log(...args: unknown[]) { void args; return readOnlyError(); }

export async function publicContents(query = '', category = '', area = ''): Promise<Row[]> {
  let rows = articles.map(row => ({ ...row }));
  if (category) { const accepted = category.split(','); rows = rows.filter(row => accepted.includes(row.category)); }
  if (area) rows = rows.filter(row => row.historical_area === area);
  if (query.trim()) rows = rows.map(row => ({ ...row, _score: matchesText(row, query) })).filter(row => row._score > 0.52).sort((a, b) => b._score - a._score);
  return rows;
}
export async function stats() {
  const ids = new Set([...seed.contents, ...bundle.articles].map(row => row.id));
  return { total: ids.size, eligible: articles.length, verified: articles.length, published: articles.length,
    pending: ids.size - articles.length, sources: sources.length };
}
export async function content(slug: string, privateAccess = false) {
  const published = articles.find(row => row.slug === slug || row.id === slug);
  if (published) return { ...published };
  if (!privateAccess) return null;
  const draft = seed.contents.find(row => row.id === slug);
  return draft ? displayRow({ ...draft, slug: `${slugify(draft.title)}-${String(draft.id).toLowerCase()}`, status: 'draft', cms_status: 'draft', eligible: 0 }) : null;
}
export async function contentCitations(id: string) { return citations.filter(row => row.content_id === id).map(row => ({ ...row })); }
export async function publicTours() { return tours.map(row => ({ ...row })); }
export async function tourStops(id: string) { return tourStopRows.filter(stop => stop.tour_id === id).map(stop => ({ ...stop, ...articleById.get(stop.content_id) })).filter(row => row.title); }
export async function publicWords() {
  return dialects.map(dialect => { const article = articleById.get(dialect.content_id)!; return {
    id: article.id, headword: dialect.headword, meaning: dialect.meaning, usage: dialect.usage_context,
    example: dialect.example, pos: dialect.part_of_speech, href: `/ho-so/${article.slug}`,
  }; }).sort((a, b) => a.headword.localeCompare(b.headword, 'vi'));
}

/** Compatibility reader for the public SQL projections still used by server components. */
export async function all(sql: string, ...params: unknown[]): Promise<Row[]> {
  const q = normalizedSql(sql);
  if (q.includes('from source_registry')) return sources.map(row => ({ ...row }));
  if (q.includes('from media_assets') && q.includes('join cultural_contents')) return media.map(item => ({ ...item, slug: articleById.get(item.content_id)?.slug, title: articleById.get(item.content_id)?.title }));
  if (q.includes('from media_assets')) return media.filter(row => !params[0] || row.content_id === params[0]).map(row => ({ ...row }));
  if (q.includes('from dialect_entries')) return dialects.filter(row => !params[0] || row.content_id === params[0]).map(row => ({ ...row }));
  if (q.includes('from cultural_contents')) return articles.map(row => ({ ...row }));
  if (q.includes('from tours')) return tours.map(row => ({ ...row }));
  if (q.includes('from tour_stops')) return tourStopRows.filter(row => !params[0] || row.tour_id === params[0]).map(row => ({ ...row }));
  return [];
}
export async function one(sql: string, ...params: unknown[]): Promise<Row | null> {
  const q = normalizedSql(sql);
  if (q.includes('from dialect_entries')) return dialects.find(row => row.content_id === params[0]) ?? null;
  if (q.includes('from tour_stops')) return tourStopRows.find(row => row.tour_id === params[0] && row.content_id === params[1]) ?? null;
  if (q.includes('from source_registry')) return sourceMap.get(String(params[0])) ?? null;
  if (q.includes('from cultural_contents')) return articles.find(row => row.id === params[0] || row.slug === params[0]) ?? null;
  return null;
}
