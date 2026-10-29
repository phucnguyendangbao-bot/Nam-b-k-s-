'use client';
import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

export type StoryChapter = {
  id: string;
  kicker: string;
  title: string;
  text: string;
  href: string;
  image: { src: string; alt: string; credit: string };
};

const wideQuery = '(min-width: 960px)';
function subscribeWide(cb: () => void) {
  const mq = window.matchMedia(wideQuery);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const isWide = () => window.matchMedia(wideQuery).matches && 'IntersectionObserver' in window;

/**
 * Câu chuyện theo chiều cuộn, không chiếm quyền cuộn của người đọc (không scroll-jacking).
 * - Mặc định (không JS, điện thoại, giảm chuyển động): mỗi chương là một khối ảnh + chữ đọc bình thường.
 * - Màn hình rộng có JS: ảnh nằm yên ở cột trái, đổi mềm theo chương đang đọc; chữ trôi ở cột phải.
 */
export function StoryScroll({ chapters, label }: { chapters: StoryChapter[]; label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const enhanced = useSyncExternalStore(subscribeWide, isWide, () => false);

  useEffect(() => {
    const el = root.current;
    if (!el || !enhanced) return;
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
    }, { rootMargin: '-45% 0px -45% 0px' });
    el.querySelectorAll('[data-index]').forEach(c => io.observe(c));
    return () => io.disconnect();
  }, [enhanced]);

  const current = chapters[active];
  return (
    <div ref={root} className="story" data-enhanced={enhanced ? 'true' : undefined} aria-label={label} role="group">
      {enhanced && (
        <div className="story-stage">
          <div className="story-frame" aria-hidden="true">
            {chapters.map((c, i) => (
              <Image key={c.id} src={c.image.src} alt="" fill sizes="(min-width: 960px) 50vw, 1px" className={i === active ? 'is-active' : undefined} loading="lazy" />
            ))}
            <span className="story-progress">{chapters.map((c, i) => <i key={c.id} className={i === active ? 'is-active' : undefined} />)}</span>
          </div>
          <p className="story-stage-credit" aria-live="off">Ảnh: {current.image.credit}</p>
        </div>
      )}
      <ol className="story-chapters">
        {chapters.map((c, i) => (
          <li key={c.id} className={`story-chapter ${enhanced && i === active ? 'is-active' : ''}`} data-index={i}>
            <figure className="story-inline">
              <Image src={c.image.src} alt={c.image.alt} width={1200} height={800} sizes="(max-width: 960px) 100vw, 1px" loading="lazy" />
              <figcaption>Ảnh: {c.image.credit}</figcaption>
            </figure>
            <div className="story-copy">
              <p className="story-kicker"><span>{String(i + 1).padStart(2, '0')}</span> {c.kicker}</p>
              <h3>{c.title}</h3>
              <p className="story-text">{c.text}</p>
              <a className="text-link" href={c.href}>Đọc hồ sơ <span aria-hidden="true">→</span></a>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
