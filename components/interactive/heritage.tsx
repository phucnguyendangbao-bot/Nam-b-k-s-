'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type Slide = { src: string; title: string; href: string; credit: string };

/** Ảnh lớn đầu trang, chuyển cảnh mờ dần. Dừng khi rê chuột, khi có focus, hoặc khi người dùng giảm chuyển động. */
export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((n: number) => setIndex((n + slides.length) % slides.length), [slides.length]);
  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setTimeout(() => go(index + 1), 6500);
    return () => window.clearTimeout(t);
  }, [index, paused, go, slides.length]);
  if (!slides.length) return null;
  return (
    <section
      className="hs-slider"
      aria-roledescription="carousel"
      aria-label="Ảnh tư liệu nổi bật"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <figure key={s.src + i} className={`hs-slide ${i === index ? 'is-active' : ''}`} aria-hidden={i !== index} aria-roledescription="slide" aria-label={`${i + 1} / ${slides.length}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.src} alt={i === index ? s.title : ''} loading={i === 0 ? 'eager' : 'lazy'} />
          <figcaption>
            <a href={s.href} tabIndex={i === index ? 0 : -1}>{s.title}</a>
            <small>{s.credit}</small>
          </figcaption>
        </figure>
      ))}
      {slides.length > 1 && (
        <>
          <button type="button" className="hs-arrow prev" onClick={() => go(index - 1)} aria-label="Ảnh trước">‹</button>
          <button type="button" className="hs-arrow next" onClick={() => go(index + 1)} aria-label="Ảnh tiếp">›</button>
          <div className="hs-dots">
            {slides.map((s, i) => (
              <button key={i} type="button" className={i === index ? 'is-active' : ''} onClick={() => go(i)} aria-label={`Xem ảnh ${i + 1}: ${s.title}`} aria-current={i === index} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/** Dải thẻ cuộn ngang có nút trái/phải, giống phòng trưng bày hiện vật. */
export function Gallery({ children, label }: { children: React.ReactNode; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const move = (dir: number) => {
    const el = track.current;
    if (!el) return;
    const item = el.querySelector<HTMLElement>(':scope > *');
    el.scrollBy({ left: dir * ((item?.offsetWidth ?? 300) + 24), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  return (
    <div className="hs-gallery" role="region" aria-label={label}>
      <button type="button" className="hs-arrow prev" onClick={() => move(-1)} aria-label="Xem mục trước">‹</button>
      <div className="hs-gallery-track" ref={track} tabIndex={0}>{children}</div>
      <button type="button" className="hs-arrow next" onClick={() => move(1)} aria-label="Xem mục tiếp">›</button>
    </div>
  );
}

export type UpdateItem = { href: string; title: string; image?: string; month: string; day: string; weekday: string; tab: string };

/** Khối "Mới cập nhật": thẻ lọc theo chuyên mục và danh sách bài kèm ô lịch. */
export function UpdatesPanel({ tabs, items }: { tabs: { id: string; label: string }[]; items: UpdateItem[] }) {
  const [tab, setTab] = useState('all');
  const list = items.filter(i => tab === 'all' || i.tab === tab).slice(0, 6);
  return (
    <div className="hs-updates">
      <div className="hs-tabs" role="tablist" aria-label="Lọc theo chuyên mục">
        {[{ id: 'all', label: 'Tất cả' }, ...tabs].map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <ul className="hs-update-list" role="tabpanel">
        {list.map(i => (
          <li key={i.href}>
            <a href={i.href}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {i.image ? <img src={i.image} alt="" loading="lazy" /> : <span className="hs-update-blank" aria-hidden="true">{i.title.length <= 8 ? i.title : i.title.slice(0, 1)}</span>}
              <span className="hs-update-text">
                <strong>{i.title}</strong>
                <span className="hs-calendar" aria-label={`Cập nhật ngày ${i.day} ${i.month}`}>
                  <small>{i.month}</small><b>{i.day}</b><em>{i.weekday}</em>
                </span>
              </span>
            </a>
          </li>
        ))}
        {!list.length && <li className="hs-update-none">Chưa có hồ sơ nào ở mục này.</li>}
      </ul>
    </div>
  );
}
