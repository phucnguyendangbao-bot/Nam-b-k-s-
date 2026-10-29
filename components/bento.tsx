import Image from 'next/image';
import { Motif } from './cards';

/**
 * Lưới Bento dùng chung, bám lưới 12 cột:
 * - `lg`   thẻ lớn nổi bật: 6 cột × 2 hàng
 * - `tall` thẻ đứng: 3 cột × 2 hàng
 * - `wide` thẻ ngang: 6 cột × 1 hàng (ảnh một bên, chữ một bên)
 * - `md`   thẻ chuẩn: 3 cột × 1 hàng
 * Máy tính bảng: lưới 6 cột (lg/wide 6, tall/md 3). Điện thoại: một cột; thẻ lớn giữ ảnh lớn,
 * các thẻ khác thành hàng ảnh nhỏ + chữ để quét nhanh bằng ngón cái.
 * Thẻ có ảnh luôn ghi tác giả và giấy phép ngay trên ảnh.
 */
export type BentoSize = 'lg' | 'tall' | 'wide' | 'md';
export type BentoItem = {
  href: string;
  title: string;
  text?: string;
  eyebrow?: string;
  meta?: string;
  size: BentoSize;
  image?: { src: string; credit: string; width?: number; height?: number; position?: string };
  /** Thẻ chữ: một chữ lớn hoặc họa tiết thay cho ảnh. */
  glyph?: { word?: string; motif?: string };
  tone?: 'river' | 'dusk' | 'lily' | 'deep';
};

const sizes: Record<BentoSize, string> = {
  lg: '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 600px',
  tall: '(max-width: 640px) 96px, (max-width: 1024px) 50vw, 300px',
  wide: '(max-width: 640px) 96px, (max-width: 1024px) 50vw, 300px',
  md: '(max-width: 640px) 96px, (max-width: 1024px) 50vw, 300px',
};

export function BentoCard({ item }: { item: BentoItem }) {
  const kind = item.image ? (item.size === 'wide' ? 'horizontal' : 'image') : 'text';
  return (
    <li className={`bento-cell is-${item.size}`}>
      <a href={item.href} className={`bento-card is-${kind} tone-${item.tone ?? 'river'}`}>
        {item.image ? (
          <span className="bento-media">
            <Image src={item.image.src} alt="" width={item.image.width ?? 1200} height={item.image.height ?? 900} sizes={sizes[item.size]} style={item.image.position ? { objectPosition: item.image.position } : undefined} />
          </span>
        ) : (
          <span className="bento-glyph" aria-hidden="true">
            {item.glyph?.word ? <span className="bento-word">{item.glyph.word}</span> : <Motif kind={item.glyph?.motif ?? 'book'} />}
          </span>
        )}
        <div className="bento-copy">
          {item.eyebrow && <span className="bento-eyebrow">{item.eyebrow}</span>}
          <h3 className="bento-title">{item.title}</h3>
          {item.text && <span className="bento-text">{item.text}</span>}
          {item.meta && <span className="bento-meta">{item.meta} <span aria-hidden="true">→</span></span>}
        </div>
      </a>
      {item.image && <small className="bento-credit">Ảnh: {item.image.credit}</small>}
    </li>
  );
}

export function BentoGrid({ items, label }: { items: BentoItem[]; label: string }) {
  return <ul className="bento" aria-label={label}>{items.map(item => <BentoCard key={item.href} item={item} />)}</ul>;
}
