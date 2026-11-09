'use client';
import { useEffect, useRef, useState } from 'react';

/** Số chạy từ `from` lên `to` khi vào màn hình. Do React giữ chữ, không sửa thẳng DOM (tránh lệch khi hydrate). */
export function CountUp({ to, from = 0, ms = 1200 }: { to: number; from?: number; ms?: number }) {
  const [n, setN] = useState(to);
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !el.current || !('IntersectionObserver' in window)) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => { const k = Math.min(1, (t - t0) / ms); setN(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, from, ms]);
  return <span ref={el} className="nx-countup"><span aria-hidden="true">{n}</span><span className="sr-only">{to}</span></span>;
}
