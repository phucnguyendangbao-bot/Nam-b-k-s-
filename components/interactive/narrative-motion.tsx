'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';


/**
 * Bấm liên kết tới một mục, một nguồn thì mục (thu gọn trong Foldable), nguồn (details) đó tự mở.
 */
function setupFolds() {
  const onClick = (e: MouseEvent) => {
    const t = e.target instanceof Element ? e.target : null;
    const a = t?.closest<HTMLAnchorElement>('a[href^="#"]');
    const target = a ? document.getElementById(decodeURIComponent(a.getAttribute('href')!.slice(1))) : null;
    if (!target) return;
    target.querySelector('[data-fold]')?.dispatchEvent(new Event('nx-unfold'));
    const det = target.querySelector('details');
    if (det && target.id.startsWith('nguon-')) det.open = true;
  };
  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}

/**
 * Bật chuyển động kể chuyện: khối `[data-nx]` nhận `data-in` khi cuộn tới (một lần), số năm trong đó chạy lên.
 * Lớp `nx-ready` chỉ thêm khi có JS và IntersectionObserver, nên khi tắt JS mọi thứ hiện đủ ngay từ đầu.
 */
export function NarrativeMotion() {
  const path = usePathname();
  useEffect(() => setupFolds(), [path]);
  useEffect(() => {
    // Các khối danh sách dùng chung trên nhiều trang: gắn nhãn để chúng cũng hiện lên khi cuộn tới.
    document.querySelectorAll<HTMLElement>('.fx-list, .tp-cards, .metric-grid, .journey-reading-grid, .bento').forEach(el => { if (!el.hasAttribute('data-nx')) el.setAttribute('data-nx', ''); });
    const els = [...document.querySelectorAll<HTMLElement>('[data-nx]:not([data-in])')];
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(el => el.setAttribute('data-in', '')); return; }
    const vh = window.innerHeight;
    const show = (el: Element) => el.setAttribute('data-in', '');
    for (const el of els) if (el.getBoundingClientRect().top < vh * 0.85) show(el);
    document.documentElement.classList.add('nx-ready');
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    els.forEach(el => { if (!el.hasAttribute('data-in')) io.observe(el); });
    return () => io.disconnect();
  }, [path]);
  useEffect(() => {
    // Tranh nét của chương chỉ "sống" (nước trôi, ghe dập dềnh…) khi đang ở trong màn hình, và không bao giờ khi giảm chuyển động.
    const arts = [...document.querySelectorAll<HTMLElement>('.ch-art')];
    if (!arts.length || !('IntersectionObserver' in window)) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        const on = e.isIntersecting && !still.matches && !document.hidden;
        if (on !== e.target.hasAttribute('data-live')) e.target.toggleAttribute('data-live', on);
      }
    }, { rootMargin: '40px 0px' });
    arts.forEach(el => io.observe(el));
    return () => { io.disconnect(); arts.forEach(el => el.removeAttribute('data-live')); };
  }, [path]);
  return null;
}

/**
 * Người đọc đang ở mục nào: đánh dấu trong mục lục bên phải, và trên màn hẹp hiện một nhãn nhỏ ở đáy
 * ("Mục 3/9 · tên mục") cùng vòng tiến độ. Bấm nhãn để về đầu mục.
 *
 * Mục đang đọc lấy từ IntersectionObserver (một dải mỏng ở 35% chiều cao màn hình), React chỉ vẽ lại khi đổi mục.
 * Vòng tiến độ trong mục chỉ tính trên màn hẹp (nơi nó hiện), ghi thẳng vào nét SVG, không qua state.
 */
export function DossierProgress({ sections }: { sections: { id: string; heading: string }[] }) {
  const [current, setCurrent] = useState(-1);
  const ring = useRef<SVGCircleElement>(null);
  const currentRef = useRef(-1);
  useEffect(() => {
    const els = sections.map(s => document.getElementById(s.id)).filter((x): x is HTMLElement => Boolean(x));
    if (!els.length || !('IntersectionObserver' in window)) return;
    const index = new Map(els.map((el, i) => [el, i]));
    const set = (i: number) => { if (i !== currentRef.current) { currentRef.current = i; setCurrent(i); } };
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        const i = index.get(e.target as HTMLElement)!;
        const line = (e.rootBounds?.top ?? innerHeight * 0.35);
        if (e.isIntersecting) set(i);
        else if (i === currentRef.current) {
          // Rời dải đọc: đi lên quá đầu mục thì về mục trước; đọc hết mục cuối thì ẩn nhãn.
          if (e.boundingClientRect.top > line) set(i - 1);
          else if (i === els.length - 1) set(-1);
        }
      }
    }, { rootMargin: '-35% 0px -64% 0px', threshold: 0 });
    els.forEach(el => io.observe(el));

    // Vòng tiến độ: chỉ tính khi nhãn đáy hiện (màn ≤ 1000px); một lần đọc vị trí mỗi khung, ghi khi giá trị đổi.
    const narrow = matchMedia('(max-width: 1000px)');
    let raf = 0, last = -1;
    const draw = () => {
      raf = 0;
      const i = currentRef.current;
      if (i < 0 || !ring.current) return;
      const r = els[i].getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (innerHeight * 0.35 - r.top) / Math.max(1, r.height)));
      const v = Math.round((1 - (i + ratio) / els.length) * 400) / 400;
      if (v !== last) { last = v; ring.current.style.strokeDashoffset = String(v); }
    };
    const onScroll = () => { if (narrow.matches && !raf) raf = requestAnimationFrame(draw); };
    addEventListener('scroll', onScroll, { passive: true });
    return () => { io.disconnect(); removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [sections]);

  useEffect(() => {
    document.querySelectorAll<HTMLAnchorElement>('.dossier-rail nav a').forEach(a => {
      const on = current >= 0 && a.getAttribute('href') === `#${sections[current]?.id}`;
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }, [current, sections]);

  const s = current >= 0 ? sections[current] : null;
  const total = sections.length;
  return (
    <a className="nx-progress" href={s ? `#${s.id}` : '#main'} data-visible={s ? 'true' : 'false'} aria-hidden={s ? undefined : true} tabIndex={s ? undefined : -1}>
      <svg viewBox="0 0 36 36" width="32" height="32" aria-hidden="true">
        <circle cx="18" cy="18" r="15" className="nx-progress-track" />
        <circle ref={ring} cx="18" cy="18" r="15" className="nx-progress-bar" pathLength={1} style={{ strokeDashoffset: s ? 1 - current / total : 1 }} />
      </svg>
      <span className="nx-progress-copy">
        <small>Mục {current + 1}/{total}</small>
        <strong>{s?.heading}</strong>
      </span>
    </a>
  );
}
