'use client';
import { useEffect, useRef } from 'react';

/**
 * Dòng sông xuyên suốt trang chủ (14/11/2026, học theo sợi chỉ xuyên trang của johnbolster.design và con đường
 * viên bi lăn theo cuộn của Tinkeroll): một nét sông duy nhất chạy từ ảnh mở đầu, men theo lề phải của chương 1,
 * uốn qua dải chuyển cảnh sang lề trái của chương 2, cứ thế đổi bờ sau mỗi chương, rồi về giữa ở phần Kết.
 * Sông tự vẽ theo cuộn; một chiếc ghe (nhìn từ trên xuống, nên quay theo mọi hướng đều tự nhiên) chở người đọc đi dọc sông.
 *
 * Đường đi được tính từ vị trí thật của các khối, nên luôn nằm ngoài cột chữ (chỉ đi trong lề và qua dải chuyển cảnh).
 * Màu nét đổi theo nền: đỏ gạch trên nền sáng, vàng in trên nền đậm (gradient theo tọa độ trang).
 * Chỉ hiện từ 1100px (lề đủ rộng); giảm chuyển động thì sông hiện đủ, ghe đứng yên; không JS thì không có gì cả.
 */
const LIGHT = '#B23F25', DARK = '#F3C969';

type Pt = [number, number];

/** Catmull-Rom → Bézier bậc ba, cho nét mềm qua mọi điểm mốc. */
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

export function StoryRiver() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current, main = root?.parentElement;
    if (!root || !main) return;
    const svg = root.querySelector('svg')!;
    const line = root.querySelector<SVGPathElement>('.sr-line')!;
    const back = root.querySelector<SVGPathElement>('.sr-back')!;
    const grad = root.querySelector<SVGLinearGradientElement>('linearGradient')!;
    const boat = root.querySelector<HTMLElement>('.sr-boat')!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let table: { len: number; y: number }[] = [];
    let total = 0, mainTop = 0, raf = 0, built = false;

    const build = () => {
      const W = main.clientWidth, H = main.scrollHeight;
      const mr = main.getBoundingClientRect();
      mainTop = mr.top + scrollY;
      if (W < 1100) { root.setAttribute('data-off', ''); built = false; return; }
      root.removeAttribute('data-off');
      const top = (el: Element) => el.getBoundingClientRect().top + scrollY - mainTop;
      const box = (el: Element) => { const r = el.getBoundingClientRect(); return { t: r.top + scrollY - mainTop, h: r.height }; };
      const wrap = main.querySelector('.toc-x .wrap, .wrap');
      const wr = wrap ? wrap.getBoundingClientRect() : { left: W * 0.08, right: W * 0.92 };
      // Lề: giữa mép khung chữ và mép trang; không bao giờ đè lên cột chữ.
      const L = Math.max(28, wr.left / 2), R = W - Math.max(28, (W - wr.right) / 2);
      const hero = main.querySelector('.hx'), toc = main.querySelector('.toc-x'), ket = main.querySelector('#ket');
      const chapters = [...main.querySelectorAll<HTMLElement>('.ch[data-chapter]')];
      const tides = [...main.querySelectorAll<HTMLElement>('.ch-tide')];
      if (!hero || !toc || !chapters.length) { built = false; return; }
      const pts: Pt[] = [];
      const hb = box(hero), tb = box(toc);
      pts.push([W * 0.52, hb.t + hb.h - 70]);
      pts.push([W * 0.66, hb.t + hb.h + 24]);
      pts.push([R, tb.t + tb.h * 0.5]);
      let side: 'R' | 'L' = 'R';
      chapters.forEach((ch, i) => {
        const b = box(ch);
        const x = side === 'R' ? R : L, bend = side === 'R' ? -16 : 16;
        pts.push([x + bend, b.t + b.h * 0.3]);
        pts.push([x - bend * 0.5, b.t + b.h * 0.68]);
        const tide = tides[i];
        if (!tide) return;
        const tt = box(tide);
        const last = i === chapters.length - 1;
        pts.push([x, tt.t + 18]);
        pts.push([W * 0.5, tt.t + tt.h * 0.42]);
        if (last) return;
        side = side === 'R' ? 'L' : 'R';
        pts.push([side === 'R' ? R : L, tt.t + tt.h - 30]);
      });
      if (ket) pts.push([W * 0.5, top(ket) + 56]);
      const d = smoothPath(pts);
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('width', String(W)); svg.setAttribute('height', String(H));
      line.setAttribute('d', d); back.setAttribute('d', d);
      boat.style.offsetPath = `path("${d}")`;
      // Màu theo nền: mỗi khối sáng/đậm cho hai điểm dừng ở mép trên và mép dưới; dải chuyển cảnh để gradient tự pha.
      grad.setAttribute('y2', String(H));
      grad.innerHTML = '';
      const blocks = [...main.children].filter(el => el !== root && !el.classList.contains('ch-tide') && el.getBoundingClientRect().height > 0);
      const stops: { y: number; c: string }[] = [];
      for (const el of blocks) {
        const b = box(el);
        const dark = el.classList.contains('is-alt') || el.classList.contains('hx');
        stops.push({ y: b.t, c: dark ? DARK : LIGHT }, { y: b.t + b.h, c: dark ? DARK : LIGHT });
      }
      stops.sort((a, b) => a.y - b.y);
      for (const s of stops) {
        const st = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        st.setAttribute('offset', String(Math.min(1, Math.max(0, s.y / H))));
        st.setAttribute('stop-color', s.c);
        grad.appendChild(st);
      }
      // Bảng tra: độ dài nét → tọa độ y (bao đơn điệu), để tìm ghe đang ở đâu theo dòng đọc.
      total = line.getTotalLength();
      table = [];
      let maxY = -Infinity;
      const N = 240;
      for (let i = 0; i <= N; i++) {
        const len = (total * i) / N;
        const p = line.getPointAtLength(len);
        maxY = Math.max(maxY, p.y);
        table.push({ len, y: maxY });
      }
      built = true;
      update();
    };

    const update = () => {
      raf = 0;
      if (!built) return;
      if (reduced.matches) { root.style.setProperty('--sp', '1'); return; }
      const readY = scrollY + innerHeight * 0.62 - mainTop;
      let lo = 0, hi = table.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (table[mid].y < readY) lo = mid + 1; else hi = mid; }
      const a = table[Math.max(0, lo - 1)], b = table[lo];
      const t = b.y === a.y ? 1 : Math.min(1, Math.max(0, (readY - a.y) / (b.y - a.y)));
      const len = a.len + (b.len - a.len) * t;
      root.style.setProperty('--sp', (total ? len / total : 0).toFixed(4));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const ro = new ResizeObserver(() => build());
    ro.observe(main);
    build();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => { ro.disconnect(); removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="sr" ref={ref} aria-hidden="true" data-off="">
      <svg focusable="false">
        <defs><linearGradient id="sr-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000" /></defs>
        <path className="sr-back" d="" />
        <path className="sr-line" d="" pathLength={1} />
      </svg>
      {/* Ghe nhìn từ trên xuống: thân thoi dài, mui cong ở giữa, nón lá người chèo ở lái, vệt nước sau lái. */}
      <span className="sr-boat">
        <svg viewBox="-34 -12 68 24" width="68" height="24">
          <path className="wake" d="M-26 -3q-10 3 -20 0M-26 3q-10 -3 -20 0" />
          <path className="hull" d="M-30 0q6-6 24-6h12q18 0 24 6q-6 6-24 6h-12q-18 0-24-6z" />
          <path className="deck" d="M-24 0q4-3.5 14-3.5h20q10 0 14 3.5q-4 3.5-14 3.5h-20q-10 0-14-3.5z" />
          <rect className="mui" x="-7" y="-5.2" width="18" height="10.4" rx="4" />
          <path className="rib" d="M-2 -5v10M3 -5v10M8 -5v10" />
          <circle className="hat" cx="-18" cy="0" r="3.4" />
          <path className="oar" d="M-18 2.5l-5 9" />
        </svg>
      </span>
    </div>
  );
}
