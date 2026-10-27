import { categories, fold } from './catalog';
import { publicContents, publicTours } from './data';
import { categoryTone, collectionFor } from '@/components/cards';

export type SearchEntry = {
  type: 'article' | 'word' | 'tour' | 'page';
  title: string;
  subtitle: string;
  href: string;
  tone: 'river' | 'dusk' | 'lily' | 'ink';
  /** Chuỗi đã bỏ dấu, chữ thường để so khớp phía trình duyệt. */
  hay: string;
};

const pages: Omit<SearchEntry, 'hay'>[] = [
  { type: 'page', title: 'Bản đồ', subtitle: 'Địa điểm đã đối chiếu tọa độ', href: '/ban-do', tone: 'ink' },
  { type: 'page', title: 'Hành trình', subtitle: 'Những chuỗi bài đọc nối với nhau', href: '/hanh-trinh', tone: 'ink' },
  { type: 'page', title: 'Nguồn tư liệu', subtitle: 'Danh sách nguồn đã đăng ký', href: '/nguon-tu-lieu', tone: 'ink' },
  { type: 'page', title: 'Gửi ký ức', subtitle: 'Gửi lời kể, cách gọi, tư liệu gia đình', href: '/ky-uc-cong-dong', tone: 'ink' },
  { type: 'page', title: 'Sổ tay', subtitle: 'Hồ sơ và hành trình bạn đã lưu', href: '/so-tay', tone: 'ink' },
  ...categories.map(c => ({ type: 'page' as const, title: c.name, subtitle: `Chuyên mục: ${c.subtitle}`, href: `/chuyen-muc/${c.slug}`, tone: categoryTone[c.slug] })),
];

export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const [items, tours] = await Promise.all([publicContents(), publicTours()]);
  const entries: SearchEntry[] = [];
  for (const c of items) {
    const collection = collectionFor(c.category);
    const isWord = c.content_kind === 'dialect';
    entries.push({
      type: isWord ? 'word' : 'article',
      title: c.title,
      subtitle: isWord ? (c.meaning ?? c.summary ?? '') : `${collection.name} · ${c.summary ?? ''}`,
      href: `/ho-so/${c.slug}`,
      tone: categoryTone[collection.slug],
      hay: fold([c.title, c.summary, c.meaning, c.usage_context, c.body, collection.name].filter(Boolean).join(' ')),
    });
  }
  for (const t of tours) {
    entries.push({ type: 'tour', title: t.title, subtitle: `${t.stop_count} chặng · ${t.description ?? ''}`, href: `/hanh-trinh/${t.slug}`, tone: 'dusk', hay: fold(`${t.title} ${t.description ?? ''} hanh trinh`) });
  }
  for (const p of pages) entries.push({ ...p, hay: fold(`${p.title} ${p.subtitle}`) });
  return entries;
}
