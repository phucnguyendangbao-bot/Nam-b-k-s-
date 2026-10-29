import Image from 'next/image';
import { categories } from '@/lib/catalog';
import type { Row } from '@/lib/static-data';
import { nfc, topics } from '@/lib/editorial-model';

/** Màu nhận diện cho từng chuyên mục: sông, hoàng hôn, bông súng. */
export const categoryTone: Record<string, 'river' | 'dusk' | 'lily'> = {
  'dat-nam-bo': 'river',
  'nep-xua': 'dusk',
  'tieng-que-minh': 'lily',
  'loi-nguoi-xua': 'dusk',
  'le-hoi': 'lily',
  'dau-xua': 'river',
};
export function toneFor(category: string) {
  const c = categories.find(cat => (cat.types as readonly string[]).includes(category));
  return c ? categoryTone[c.slug] : 'river';
}
export function collectionFor(category: string) {
  return categories.find(cat => (cat.types as readonly string[]).includes(category)) ?? categories[0];
}

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg className="nb-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={diagonal ? 'M6 18 18 6M8 6h10v10' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Motif({ kind = 'river' }: { kind?: string }) {
  return (
    <svg viewBox="0 0 180 120" aria-hidden="true" className={`motif motif-${kind}`}>
      {kind === 'river' ? <><path d="M-20 105C80 30 70 90 200 10M-20 120C80 45 70 105 200 25M-20 135C80 60 70 120 200 40" /><path d="m70 53 28-12 22 12ZM64 55h58l-12 12H79Z" /></>
        : kind === 'house' ? <path d="m29 60 61-37 61 37M42 56v49h97V56M58 105V68h20v37m22 0V68h21v37M21 105h139m-125-51 55-33 55 33" />
        : kind === 'type' ? <><text x="40" y="79" fill="currentColor" stroke="none" fontSize="60" fontFamily="Be Vietnam Pro, sans-serif" fontWeight="800">à</text><path d="M95 45h47m-47 14h30m-30 14h47m-47 14h25M37 98h109" /></>
        : kind === 'book' ? <path d="M90 42c-20-15-37-14-60-7v64c23-7 40-8 60 7 20-15 37-14 60-7V35c-23-7-40-8-60 7v64M41 47c14-3 25 0 36 5M41 61c14-3 25 0 36 5M41 75c14-3 25 0 36 5m25-28c11-5 22-8 36-5m-36 19c11-5 22-8 36-5m-36 19c11-5 22-8 36-5" />
        : kind === 'sun' ? <><circle cx="90" cy="64" r="25" /><circle cx="90" cy="64" r="37" strokeDasharray="1 9" /><path d="M90 7v12m0 90v12M33 64H21m138 0h-12M49 23l8 9m66 66 8 9M131 23l-8 9m-66 66-8 9" /></>
        : <path d="M44 106V56a46 46 0 0 1 92 0v50M60 106V57a30 30 0 0 1 60 0v49M32 106h116M90 9v96M35 57h110M41 41h98" />}
    </svg>
  );
}

/** Thẻ hồ sơ dạng “nhãn hiện vật”: khung ảnh, chuyên mục, tiêu đề, mô tả, lớp thông tin và ghi công ảnh. */
export function StoryCard({ item: c, preview = false, headingLevel = 3 }: { item: Row; preview?: boolean; headingLevel?: 2 | 3 }) {
  const collection = collectionFor(c.category);
  const tone = categoryTone[collection.slug];
  const isWord = c.content_kind === 'dialect';
  const href = preview ? `/quan-tri/ban-thao/${c.id}` : `/ho-so/${c.slug}`;
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const motif = c.topic === 'architecture' ? 'house' : collection.motif;
  return (
    <article className={`nb-story-card tone-${tone}`}>
      <a className="nb-story-media" href={href} tabIndex={-1} aria-hidden="true">
        {c.image_url
          ? <Image src={c.image_url} alt="" width={800} height={600} sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 400px" loading="lazy" />
          : isWord ? <span className="nb-story-word">{nfc(c.title)}</span> : <Motif kind={motif} />}
        <span className="nb-sticker">{c.topic && topics[c.topic] ? topics[c.topic] : collection.name}</span>
      </a>
      <div className="nb-story-body">
        <H className={isWord ? 'is-word' : undefined}><a href={href}>{isWord ? <>Mục từ “{nfc(c.title)}”</> : nfc(c.title)}</a></H>
        {c.part_of_speech && <p className="nb-word-pos">{c.part_of_speech}</p>}
        <p>{c.meaning ?? c.summary}</p>
        {!isWord && <EvidenceMix sectionsJson={c.sections_json} compact />}
        {preview && <span className={`status status-${c.cms_status ?? 'draft'}`}>{c.cms_status ?? 'Bản nháp'}</span>}
      </div>
      {c.image_url && <small className="nb-story-credit">Ảnh: {c.image_author}, {c.image_source_url ? <a href={c.image_source_url} target="_blank" rel="noreferrer">{c.image_license}</a> : c.image_license}</small>}
    </article>
  );
}

/** Nhóm nhãn tri thức thành bốn lớp đọc được: có tư liệu, giả thuyết, truyền thống kể, ghi chú biên tập. */
export const evidenceGroups = [
  { id: 'fact', kind: 'documented_history', label: 'có tư liệu', kinds: ['documented_history', 'observed_practice', 'explanation'] },
  { id: 'hypo', kind: 'hypothesis', label: 'giả thuyết', kinds: ['hypothesis'] },
  { id: 'lore', kind: 'folk_belief', label: 'truyền thống kể', kinds: ['folk_belief', 'legend', 'anecdote', 'community_memory'] },
  { id: 'note', kind: 'editorial_note', label: 'ghi chú biên tập', kinds: ['editorial_note'] },
] as const;

export function evidenceMix(sectionsJson?: string | null) {
  let kinds: string[] = [];
  try { const parsed: unknown = JSON.parse(sectionsJson ?? '[]'); if (Array.isArray(parsed)) kinds = parsed.map(s => (s && typeof s === 'object' && 'kind' in s ? String((s as { kind: unknown }).kind) : '')); } catch { kinds = []; }
  return evidenceGroups.map(g => ({ ...g, count: kinds.filter(k => (g.kinds as readonly string[]).includes(k)).length })).filter(g => g.count > 0);
}

/** Dải nhỏ cho biết bài gồm những lớp thông tin nào, để người đọc biết trước đâu là dữ kiện, đâu là giả thuyết. */
export function EvidenceMix({ sectionsJson, compact = false }: { sectionsJson?: string | null; compact?: boolean }) {
  const mix = evidenceMix(sectionsJson);
  if (!mix.length) return null;
  return (
    <p className={`ev-mix ${compact ? 'is-compact' : ''}`}>
      <span className="sr-only">Số đoạn theo loại thông tin: </span>
      {mix.map(g => (
        <span key={g.id} className={`ev-mix-item kind-${g.kind}`}><i aria-hidden="true" />{g.count} {g.label}</span>
      ))}
    </p>
  );
}
