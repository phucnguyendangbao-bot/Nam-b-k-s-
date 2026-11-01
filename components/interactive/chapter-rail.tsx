'use client';
import { useEffect, useState } from 'react';

type Item = { n: number; name: string; anchor: string };

/**
 * Mục lục nổi bên trái khi đọc các chương (chỉ màn hình rộng). Chương đang đọc được đánh dấu;
 * bấm để nhảy tới chương. Không có JS thì không hiện, trang vẫn đọc trọn vẹn.
 */
export function ChapterRail({ items }: { items: Item[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const sections = items.map(i => document.getElementById(i.anchor)).filter((x): x is HTMLElement => Boolean(x));
    if (!sections.length || !('IntersectionObserver' in window)) return;
    const seen = new Map<number, number>();
    const io = new IntersectionObserver(entries => {
      for (const e of entries) seen.set(Number((e.target as HTMLElement).dataset.chapter), e.isIntersecting ? e.intersectionRatio : 0);
      let best = 0, ratio = 0;
      seen.forEach((r, n) => { if (r > ratio) { ratio = r; best = n; } });
      setActive(best);
    }, { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.01, 0.25, 0.5, 1] });
    sections.forEach(s => io.observe(s));
    return () => io.disconnect();
  }, [items]);
  return (
    <nav className="ch-rail" aria-label="Các chương" data-visible={active > 0 ? 'true' : 'false'}>
      <ol>
        {items.map(i => (
          <li key={i.n}>
            <a href={`#${i.anchor}`} aria-current={active === i.n ? 'step' : undefined}>
              <span className="ch-rail-n">{String(i.n).padStart(2, '0')}</span>
              <span className="ch-rail-name">{i.name}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
