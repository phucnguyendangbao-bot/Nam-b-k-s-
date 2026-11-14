'use client';
import { useEffect } from 'react';

/**
 * Màn mở đầu của trang chủ, chỉ hiện lần đầu mỗi phiên.
 * Một đoạn chừng ba giây: trời chuyển từ đêm sang rạng đông, dòng sông tự vẽ, một chiếc ghe Nam Bộ chạy dọc sông,
 * tên “Nam Bộ Ký Sự” hiện ra như nét bút đang viết; rồi màn kéo lên để lộ ảnh mở đầu, ảnh từ màu cũ hiện dần ra màu thật.
 *
 * Bật hay không do một đoạn script nhỏ trong <head> quyết định trước khi trang vẽ (layout.tsx, INTRO_GATE):
 * chỉ ở trang chủ, chưa xem trong phiên này, không có #mục trên địa chỉ, không bật giảm chuyển động. `?intro=1` để xem lại.
 * Màn tự kéo lên bằng CSS (scenes.css), nên dù JS của React lỗi thì màn vẫn tự mất. JS ở đây chỉ để bỏ qua sớm:
 * bấm, chạm, cuộn hoặc nhấn phím bất kỳ.
 */
export const INTRO_GATE = "try{var d=document.documentElement,f=/[?&]intro=1(&|$)/.test(location.search);if(location.pathname==='/'&&(f||(!location.hash&&!sessionStorage.getItem('nbks-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches))){d.classList.add('intro-on');sessionStorage.setItem('nbks-intro','1')}}catch(e){}";

/** Ghe Nam Bộ, vẽ theo cùng dáng chiếc ghe giữa các chương: thân thấp hai đầu vểnh, mui cong, người đội nón lá chèo ở lái. */
function Ghe() {
  return (
    <g className="intro-ghe">
      <g className="intro-ghe-bob">
        <path className="oar" d="M-18 -16L-28 -1" />
        <path className="mui" d="M-8 -9v-6q10-9 20 0v6z" />
        <path className="rib" d="M-3 -17.5V-9M2 -19V-9M7 -17.5V-9" />
        <path className="hull" d="M-30 -12q6 3 12 3h34q8 0 14-8l-3 9q-3 6-10 6h-35q-8 0-12-10z" />
        <path className="hull" d="M-20 -9l1.6-9h3l1.4 9z" />
        <circle className="hull" cx="-17" cy="-20.4" r="1.8" />
        <path className="hat" d="M-21.5 -20.6L-17 -24.4l4.5 3.8z" />
      </g>
    </g>
  );
}

/** Một khóm dừa nước bên bờ: các tàu lá xòe từ gốc. */
function Dua({ x, flip = false, s = 1, m = false }: { x: number; flip?: boolean; s?: number; m?: boolean }) {
  const fronds = [[-46, -62], [-30, -86], [-10, -98], [8, -92], [26, -74], [40, -50], [-56, -36]];
  return (
    <g className={`intro-dua${m ? ' m' : ''}`} transform={`translate(${x} 182) scale(${flip ? -s : s} ${s})`}>
      {fronds.map(([dx, dy], i) => <path key={i} d={`M0 0 Q${dx * 0.35} ${dy * 0.7} ${dx} ${dy}`} />)}
      {fronds.map(([dx, dy], i) => <path key={`b${i}`} className="leaf" d={`M${dx * 0.55} ${dy * 0.62} l${dx > 0 ? 7 : -7} 4 M${dx * 0.75} ${dy * 0.8} l${dx > 0 ? 6 : -6} 5`} />)}
    </g>
  );
}

const RIVER = 'M-40 186 C 120 168, 260 202, 420 184 S 700 166, 860 190';

export function Intro({ total = 0 }: { total?: number }) {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('intro-on')) return;
    const el = document.querySelector<HTMLElement>('.intro');
    if (!el) return;
    // Số hồ sơ đếm từ 0 lên trong lúc màn chạy (như màn tải của Tinkeroll, The Aviator).
    const num = el.querySelector<HTMLElement>('.intro-count b');
    const target = Number(num?.dataset.to ?? 0);
    const t0 = performance.now();
    let cRaf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0 - 300) / 2500);
      if (num) num.textContent = String(Math.round(target * (k < 0 ? 0 : 1 - Math.pow(1 - k, 3))));
      if (k < 1) cRaf = requestAnimationFrame(tick);
    };
    cRaf = requestAnimationFrame(tick);
    let lifting = false;
    const done = () => { root.classList.add('intro-done'); off(); };
    const skip = () => {
      if (lifting) return;
      lifting = true;
      root.classList.add('intro-skip');
    };
    const onKey = (e: KeyboardEvent) => { if (!e.metaKey && !e.ctrlKey && !e.altKey) skip(); };
    const onAnimStart = (e: AnimationEvent) => { if (e.target === el && e.animationName.startsWith('intro-lift')) lifting = true; };
    const onAnimEnd = (e: AnimationEvent) => { if (e.target === el && e.animationName.startsWith('intro-lift')) done(); };
    const opts = { passive: true } as const;
    window.addEventListener('pointerdown', skip, opts);
    window.addEventListener('wheel', skip, opts);
    window.addEventListener('touchmove', skip, opts);
    window.addEventListener('keydown', onKey);
    el.addEventListener('animationstart', onAnimStart);
    el.addEventListener('animationend', onAnimEnd);
    // Phòng khi sự kiện kết thúc không tới (tab nền, trình duyệt bỏ animation): dọn sau 6 giây.
    const t = window.setTimeout(done, 6000);
    function off() {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('touchmove', skip);
      window.removeEventListener('keydown', onKey);
      el!.removeEventListener('animationstart', onAnimStart);
      el!.removeEventListener('animationend', onAnimEnd);
      window.clearTimeout(t);
      if (cRaf) cancelAnimationFrame(cRaf);
    }
    return off;
  }, []);

  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-sky" />
      <div className="intro-dawn" />
      <div className="intro-copy">
        <p className="intro-title"><span>Nam Bộ Ký Sự</span></p>
        <p className="intro-tag"><span>Một vùng đất</span><i>·</i><span>Ngàn câu chuyện</span><i>·</i><span>Muôn hành trình</span></p>
      </div>
      <svg className="intro-scene" viewBox="0 0 800 260" preserveAspectRatio="xMidYMax slice" focusable="false">
        <defs>
          <radialGradient id="intro-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#FFE7A6" />
            <stop offset=".55" stopColor="#F3C969" />
            <stop offset="1" stopColor="#F3C969" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="intro-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#24467A" stopOpacity=".0" />
            <stop offset=".35" stopColor="#172B4D" stopOpacity=".85" />
            <stop offset="1" stopColor="#0E1A30" />
          </linearGradient>
        </defs>
        <circle className="intro-sun-glow" cx="400" cy="176" r="120" fill="url(#intro-sun)" />
        <circle className="intro-sun" cx="400" cy="176" r="34" />
        <rect x="-40" y="182" width="880" height="90" fill="url(#intro-water)" />
        <path className="intro-river back" d={RIVER} transform="translate(0 16)" />
        <path className="intro-river" d={RIVER} pathLength={1} />
        <Dua x={70} s={1.05} /><Dua x={128} s={.8} flip /><Dua x={712} s={1.1} flip /><Dua x={660} s={.75} />
        {/* Màn hẹp chỉ thấy khúc sông giữa: thêm hai khóm nhỏ gần giữa, ẩn trên màn rộng. */}
        <Dua x={292} s={.55} m /><Dua x={520} s={.5} flip m />
        <g>
          <Ghe />
          <animateMotion dur="2.7s" begin="0.3s" fill="freeze" rotate="auto" path={RIVER} keyPoints="0.02;0.64" keyTimes="0;1" calcMode="spline" keySplines=".25 .1 .25 1" />
        </g>
      </svg>
      {total > 0 && <p className="intro-count"><b data-to={total}>0</b><small>hồ sơ đã kiểm chứng</small><i /></p>}
      <p className="intro-hint">Chạm hoặc nhấn phím để bỏ qua</p>
    </div>
  );
}
