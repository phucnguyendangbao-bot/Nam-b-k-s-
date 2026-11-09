'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Chiều cao khi thu gọn, tính theo cỡ chữ đọc (khớp với .nx-text.is-folded trong narrative.css). */
const FOLD_EM = 10;

/** Mở một khối chữ đã thu gọn, có chuyển động chiều cao. */
function unfold(box: HTMLElement, open: boolean) {
  const btn = box.querySelector<HTMLButtonElement>('[data-fold-btn]');
  if (open) {
    box.style.maxHeight = `${box.scrollHeight}px`;
    box.classList.add('is-open');
    const done = () => { if (box.classList.contains('is-open')) box.style.maxHeight = 'none'; };
    box.addEventListener('transitionend', done, { once: true });
    window.setTimeout(done, 900);
  } else {
    box.style.maxHeight = `${box.scrollHeight}px`;
    requestAnimationFrame(() => { box.classList.remove('is-open'); box.style.maxHeight = ''; });
    const top = box.closest('section')?.getBoundingClientRect().top ?? 0;
    if (top < 0) box.closest('section')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  }
  if (btn) { btn.setAttribute('aria-expanded', String(open)); btn.querySelector('span')!.textContent = open ? 'Thu gọn' : 'Đọc tiếp'; }
}

/**
 * Thu gọn lời văn dài của mỗi mục: chỉ hiện vài dòng đầu, bấm "Đọc tiếp" để mở.
 * Không JS thì không thu gì. Bấm liên kết tới một mục, một nguồn thì mục, nguồn đó tự mở.
 */
function setupFolds() {
  const boxes = [...document.querySelectorAll<HTMLElement>('[data-fold]')];
  for (const box of boxes) {
    if (box.dataset.foldReady) continue;
    box.dataset.foldReady = '1';
    const limit = parseFloat(getComputedStyle(box).fontSize) * FOLD_EM;
    if (!limit || box.scrollHeight < limit * 1.3) continue;
    box.classList.add('is-folded');
    const btn = box.querySelector<HTMLButtonElement>('[data-fold-btn]');
    if (btn) btn.hidden = false;
  }
  const onClick = (e: MouseEvent) => {
    const t = e.target instanceof Element ? e.target : null;
    const btn = t?.closest<HTMLButtonElement>('[data-fold-btn]');
    if (btn) { const box = btn.closest<HTMLElement>('[data-fold]'); if (box) unfold(box, !box.classList.contains('is-open')); return; }
    const a = t?.closest<HTMLAnchorElement>('a[href^="#"]');
    const target = a ? document.getElementById(decodeURIComponent(a.getAttribute('href')!.slice(1))) : null;
    if (!target) return;
    const box = target.querySelector<HTMLElement>('[data-fold].is-folded:not(.is-open)');
    if (box) unfold(box, true);
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

/** Thẻ và ảnh nghiêng theo con trỏ như một tấm ảnh cầm trên tay, có vệt sáng chạy theo. */
const TILT = '.ch-entry-media, .bento-card, .nb-story-card, .nx-figure .photo-frame, .nx-cover .photo-frame, .related-tour, .ch-media-frame, .toc a';
/** Vùng có chiều sâu: các lớp bên trong dịch theo con trỏ với độ sâu khác nhau. */
const SCENE = '.hx, .ch-top, .nx-timeline';

/**
 * Hiệu ứng 3D theo con trỏ (chỉ thiết bị có chuột, không bật khi giảm chuyển động).
 * Chỉ đặt biến CSS (--rx, --ry, --gx, --gy cho thẻ nghiêng; --mx, --my từ -1 tới 1 cho vùng có chiều sâu);
 * cách biến đổi nằm trong narrative.css. Không chặn cuộn, không đổi bố cục.
 */
export function Depth3D() {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!fine.matches || reduced()) return;
    document.documentElement.classList.add('d3-ready');
    let raf = 0, last: PointerEvent | null = null;
    let tilted: HTMLElement | null = null, scene: HTMLElement | null = null;
    const reset = (el: HTMLElement | null, keys: string[]) => { if (el) { keys.forEach(k => el.style.removeProperty(k)); el.removeAttribute('data-tilting'); } };
    const frame = () => {
      raf = 0;
      const e = last; if (!e) return;
      const target = e.target instanceof Element ? e.target : null;
      const t = target?.closest<HTMLElement>(TILT) ?? null;
      if (t !== tilted) { reset(tilted, ['--rx', '--ry', '--gx', '--gy', '--px', '--py']); tilted = t; }
      if (t) {
        const r = t.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        const max = Math.max(3, Math.min(9, 2400 / Math.max(r.width, r.height)));
        t.style.setProperty('--ry', `${((x - .5) * 2 * max).toFixed(2)}deg`);
        t.style.setProperty('--rx', `${((.5 - y) * 2 * max).toFixed(2)}deg`);
        t.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        t.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
        t.style.setProperty('--px', ((x - .5) * 2).toFixed(3));
        t.style.setProperty('--py', ((y - .5) * 2).toFixed(3));
        t.setAttribute('data-tilting', '');
      }
      const s = target?.closest<HTMLElement>(SCENE) ?? null;
      if (s !== scene) { reset(scene, ['--mx', '--my']); scene = s; }
      if (s) {
        const r = s.getBoundingClientRect();
        s.style.setProperty('--mx', (((e.clientX - r.left) / r.width - .5) * 2).toFixed(3));
        s.style.setProperty('--my', (((e.clientY - r.top) / r.height - .5) * 2).toFixed(3));
      }
    };
    const onMove = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; last = e; if (!raf) raf = requestAnimationFrame(frame); };
    const onLeave = () => { reset(tilted, ['--rx', '--ry', '--gx', '--gy', '--px', '--py']); reset(scene, ['--mx', '--my']); tilted = scene = null; };
    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => { document.removeEventListener('pointermove', onMove); document.documentElement.removeEventListener('pointerleave', onLeave); if (raf) cancelAnimationFrame(raf); onLeave(); };
  }, []);
  return null;
}
