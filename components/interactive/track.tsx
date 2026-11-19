'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Băng trượt ngang cho các hồ sơ của một chương: cuộn ngang tự nhiên (vuốt, bàn di, phím Shift+lăn),
 * có hai nút qua lại và một thanh tiến độ. Không JS thì vẫn cuộn ngang được bằng tay.
 */
export function Track({ label, children }: { label: string; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  // State chỉ giữ những gì đổi giao diện nút (đầu, cuối, vừa khít); vị trí thanh tiến độ ghi thẳng bằng transform.
  const [state, setState] = useState({ start: true, end: false, fits: false, ready: false });
  const geo = useRef({ p: 0, w: 1 });

  useEffect(() => {
    const el = box.current?.querySelector<HTMLElement>('.ch-track-list');
    if (!el) return;
    let raf = 0, lastKey = '', lastBar = '';
    const read = () => {
      raf = 0;
      const max = el.scrollWidth - el.clientWidth;
      const p = max > 0 ? el.scrollLeft / max : 0, w = el.scrollWidth ? el.clientWidth / el.scrollWidth : 1;
      geo.current = { p, w };
      const next = { start: el.scrollLeft < 8, end: el.scrollLeft > max - 8, fits: w >= 0.995, ready: true };
      const key = `${next.start}${next.end}${next.fits}`;
      if (key !== lastKey) { lastKey = key; setState(next); }
      const t = `translateX(${(p * (1 - w) * 100).toFixed(2)}%) scaleX(${w.toFixed(4)})`;
      if (bar.current && t !== lastBar) { lastBar = t; bar.current.style.transform = t; }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    el.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { el.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf); };
  }, []);

  const move = (d: number) => {
    const el = box.current?.querySelector<HTMLElement>('.ch-track-list');
    if (!el) return;
    const card = el.querySelector<HTMLElement>(':scope > li');
    const step = card ? card.getBoundingClientRect().width + 24 : el.clientWidth * .8;
    el.scrollBy({ left: d * step * Math.max(1, Math.floor(el.clientWidth / step)), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const fits = state.ready && state.fits;
  // Thanh tiến độ chỉ có sau lần đo đầu: gắn vị trí ngay khi phần tử xuất hiện.
  const setBar = useCallback((el: HTMLElement | null) => {
    bar.current = el;
    if (el) { const { p, w } = geo.current; el.style.transform = `translateX(${(p * (1 - w) * 100).toFixed(2)}%) scaleX(${w.toFixed(4)})`; }
  }, []);

  return (
    <div ref={box} className="ch-track" role="group" aria-label={label} data-fits={fits ? 'true' : undefined} data-start={state.start ? 'true' : undefined} data-end={state.end ? 'true' : undefined}>
      {children}
      {state.ready && !fits && (
        <div className="ch-track-bar">
          <span className="ch-track-progress" aria-hidden="true"><i ref={setBar} /></span>
          <button type="button" onClick={() => move(-1)} disabled={state.start} aria-label="Xem các hồ sơ trước">←</button>
          <button type="button" onClick={() => move(1)} disabled={state.end} aria-label="Xem các hồ sơ tiếp">→</button>
        </div>
      )}
    </div>
  );
}
