'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Số năm chạy từ mốc trước tới mốc này, để người đọc cảm được quãng thời gian giữa hai mốc. */
function countUp(el: HTMLElement) {
  const to = Number(el.dataset.count), from = Number(el.dataset.from ?? to);
  if (!Number.isFinite(to) || !Number.isFinite(from) || from === to || reduced()) return;
  const span = Math.min(900, 300 + Math.abs(to - from) * 6), t0 = performance.now();
  const tick = (t: number) => {
    const k = Math.min(1, (t - t0) / span), e = 1 - Math.pow(1 - k, 3);
    el.textContent = String(Math.round(from + (to - from) * e));
    if (k < 1) requestAnimationFrame(tick);
  };
  el.textContent = String(from);
  requestAnimationFrame(tick);
}

/**
 * Bật chuyển động kể chuyện: khối `[data-nx]` nhận `data-in` khi cuộn tới (một lần), số năm trong đó chạy lên.
 * Lớp `nx-ready` chỉ thêm khi có JS và IntersectionObserver, nên khi tắt JS mọi thứ hiện đủ ngay từ đầu.
 */
export function NarrativeMotion() {
  const path = usePathname();
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>('[data-nx]:not([data-in])')];
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(el => el.setAttribute('data-in', '')); return; }
    const vh = window.innerHeight;
    const show = (el: Element) => { el.setAttribute('data-in', ''); el.querySelectorAll<HTMLElement>('[data-count]').forEach(c => { if (c.closest('[data-nx]') === el) countUp(c); }); };
    for (const el of els) if (el.getBoundingClientRect().top < vh * 0.85) el.setAttribute('data-in', '');
    document.documentElement.classList.add('nx-ready');
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    els.forEach(el => { if (!el.hasAttribute('data-in')) io.observe(el); });
    return () => io.disconnect();
  }, [path]);
  return null;
}

/**
 * Người đọc đang ở mục nào: đánh dấu trong mục lục bên phải, và trên màn hẹp hiện một nhãn nhỏ ở đáy
 * ("Mục 3/9 · tên mục") cùng vòng tiến độ. Bấm nhãn để về đầu mục.
 */
export function DossierProgress({ sections }: { sections: { id: string; heading: string }[] }) {
  const [current, setCurrent] = useState(-1);
  const [ratio, setRatio] = useState(0);
  useEffect(() => {
    const els = sections.map(s => document.getElementById(s.id)).filter((x): x is HTMLElement => Boolean(x));
    if (!els.length) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.35;
      let idx = -1;
      els.forEach((el, i) => { if (el.getBoundingClientRect().top <= line) idx = i; });
      const last = els[els.length - 1].getBoundingClientRect();
      if (last.bottom < line * 0.5) idx = -1;
      setCurrent(idx);
      if (idx >= 0) {
        const r = els[idx].getBoundingClientRect();
        setRatio(Math.max(0, Math.min(1, (line - r.top) / Math.max(1, r.height))));
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [sections]);

  useEffect(() => {
    document.querySelectorAll<HTMLAnchorElement>('.dossier-rail nav a').forEach(a => {
      const on = current >= 0 && a.getAttribute('href') === `#${sections[current]?.id}`;
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }, [current, sections]);

  const s = current >= 0 ? sections[current] : null;
  const total = sections.length;
  const progress = s ? (current + ratio) / total : 0;
  return (
    <a className="nx-progress" href={s ? `#${s.id}` : '#main'} data-visible={s ? 'true' : 'false'} aria-hidden={s ? undefined : true} tabIndex={s ? undefined : -1}>
      <svg viewBox="0 0 36 36" width="32" height="32" aria-hidden="true">
        <circle cx="18" cy="18" r="15" className="nx-progress-track" />
        <circle cx="18" cy="18" r="15" className="nx-progress-bar" pathLength={1} style={{ strokeDashoffset: 1 - progress }} />
      </svg>
      <span className="nx-progress-copy">
        <small>Mục {current + 1}/{total}</small>
        <strong>{s?.heading}</strong>
      </span>
    </a>
  );
}
