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
 * Chỉ hiện từ 1100px (lề đủ rộng); giảm chuyển động thì sông hiện đủ, ghe đậu ở cuối; không JS thì không có gì cả.
 *
 * Hiệu năng (19/11/2026): trước đây cả dòng sông là một SVG cao ~15.000px, mỗi khung hình đổi stroke-dashoffset nên
 * trình duyệt phải vẽ lại cả tấm. Nay sông được cắt thành từng ô cao bằng một màn hình; mỗi ô vẽ sẵn một lần,
 * phần "đã chảy tới" được mở bằng hai phép dịch (transform) của một khung cắt, nên khi cuộn chỉ còn việc ghép lớp.
 * Ghe đi bằng translate + rotate tra từ bảng điểm tính sẵn (không dùng offset-path). Chỉ ghi style khi giá trị đổi.
 */
const LIGHT = '#B23F25', DARK = '#F3C969';

type Pt = [number, number];

/** Catmull-Rom → Bézier bậc ba, cho nét mềm qua mọi điểm mốc. */
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    // Giữ điểm điều khiển trong khoảng ngang của đoạn: nét không văng ra ngoài lề hay trùm lên chữ khi đổi bờ.
    const lo = Math.min(p1[0], p2[0]), hi = Math.max(p1[0], p2[0]);
    const cx = (v: number) => Math.min(hi, Math.max(lo, v));
    // Theo chiều dọc cũng vậy, và giữ thứ tự p1 ≤ c1 ≤ c2 ≤ p2: mỗi đoạn chỉ đi xuống, nên "sông chảy tới đâu" theo
    // chiều đọc trùng với "sông chảy tới đâu" theo chiều dài nét.
    const ylo = Math.min(p1[1], p2[1]), yhi = Math.max(p1[1], p2[1]);
    const cy = (v: number, lo = ylo) => Math.min(yhi, Math.max(lo, v));
    const c1: Pt = [cx(p1[0] + (p2[0] - p0[0]) / 6), cy(p1[1] + (p2[1] - p0[1]) / 6)];
    const c2: Pt = [cx(p2[0] - (p3[0] - p1[0]) / 6), cy(p2[1] - (p3[1] - p1[1]) / 6, c1[1])];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

export function StoryRiver() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current, main = root?.parentElement;
    if (!root || !main) return;
    const tilesBox = root.querySelector<HTMLElement>('.sr-tiles')!;
    const measure = root.querySelector<SVGPathElement>('.sr-measure')!;
    const grad = root.querySelector<SVGLinearGradientElement>('linearGradient')!;
    const boat = root.querySelector<HTMLElement>('.sr-boat')!;
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const NS = 'http://www.w3.org/2000/svg';

    const clip = root.querySelector<HTMLElement>('.sr-clip')!, front = root.querySelector<HTMLElement>('.sr-front')!;
    let H = 0, shown = -1;
    // Bảng điểm dọc nét sông: x, y, góc (độ), và y lớn nhất tính tới điểm đó (để tra theo dòng đọc).
    let xs = new Float32Array(0), ys = new Float32Array(0), as = new Float32Array(0), my = new Float32Array(0);
    let mainTop = 0, vh = innerHeight, built = false, listening = false;
    let target = 0, cur = -1, raf = 0, boatKey = '';

    const at = (y: number) => {
      // Điểm đầu tiên có maxY ≥ y; nội suy với điểm trước đó.
      const n = my.length;
      if (!n) return null;
      if (y <= my[0]) return { x: xs[0], y: ys[0], a: as[0] };
      if (y >= my[n - 1]) return { x: xs[n - 1], y: ys[n - 1], a: as[n - 1] };
      let lo = 0, hi = n - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (my[mid] < y) lo = mid + 1; else hi = mid; }
      const i = Math.max(1, lo), t = my[i] === my[i - 1] ? 1 : (y - my[i - 1]) / (my[i] - my[i - 1]);
      return { x: xs[i - 1] + (xs[i] - xs[i - 1]) * t, y: ys[i - 1] + (ys[i] - ys[i - 1]) * t, a: as[i] };
    };

    /** Mở phần sông phía trên dòng đọc: hai phép dịch ngược chiều nhau (khung cắt và nét bên trong), chỉ ghi khi đổi. */
    const paint = (readY: number) => {
      const r = Math.round(Math.min(H, Math.max(0, readY)));
      if (r !== shown) {
        shown = r;
        clip.style.transform = r >= H ? '' : `translate3d(0,${r - H}px,0)`;
        front.style.transform = r >= H ? '' : `translate3d(0,${H - r}px,0)`;
      }
      const p = at(readY);
      if (!p) return;
      const key = `${p.x.toFixed(1)},${p.y.toFixed(1)},${p.a.toFixed(1)}`;
      if (key === boatKey) return;
      boatKey = key;
      boat.style.transform = `translate3d(${(p.x - 34).toFixed(1)}px,${(p.y - 12).toFixed(1)}px,0) rotate(${p.a.toFixed(1)}deg)`;
    };

    /**
     * Đường nhanh: nơi có ScrollTimeline, cả khung cắt lẫn ghe chạy bằng animation gắn vào thanh cuộn. Trình duyệt tự
     * nội suy trên luồng ghép lớp, JS không làm gì trong lúc cuộn. Ghe đi qua ~480 mốc tính sẵn dọc nét sông.
     */
    type Timeline = new (o: { source: Element; axis?: 'block' | 'inline' }) => AnimationTimeline;
    const ScrollTL = (window as unknown as { ScrollTimeline?: Timeline }).ScrollTimeline;
    let anims: Animation[] = [];
    const stopAnims = () => { anims.forEach(a => a.cancel()); anims = []; };
    const drive = () => {
      stopAnims();
      const se = document.scrollingElement;
      const max = se ? se.scrollHeight - innerHeight : 0;
      if (!ScrollTL || !se || max <= 0) return false;
      const timeline = new ScrollTL({ source: se, axis: 'block' });
      const r0 = vh * 0.62 - mainTop;
      const r = (o: number) => Math.min(H, Math.max(0, r0 + o * max));
      const cut = [0, 1, -r0 / max, (H - r0) / max].filter(o => o >= 0 && o <= 1).sort((a, b) => a - b);
      const opts: KeyframeAnimationOptions = { timeline, fill: 'both', easing: 'linear' };
      anims.push(clip.animate(cut.map(o => ({ offset: o, transform: `translate3d(0,${(r(o) - H).toFixed(1)}px,0)` })), opts));
      anims.push(front.animate(cut.map(o => ({ offset: o, transform: `translate3d(0,${(H - r(o)).toFixed(1)}px,0)` })), opts));
      const K = 480, frames: Keyframe[] = [];
      let prev: number | null = null;
      for (let k = 0; k <= K; k++) {
        const p = at(r0 + (k / K) * max);
        if (!p) return false;
        // Góc liền mạch (không nhảy 359° → 0°) để phép nội suy giữa hai mốc không làm ghe quay vòng.
        let a = p.a;
        if (prev !== null) while (a - prev > 180) a -= 360;
        if (prev !== null) while (prev - a > 180) a += 360;
        prev = a;
        frames.push({ offset: k / K, transform: `translate3d(${(p.x - 34).toFixed(1)}px,${(p.y - 12).toFixed(1)}px,0) rotate(${a.toFixed(1)}deg)` });
      }
      anims.push(boat.animate(frames, opts));
      return true;
    };

    const readLine = () => scrollY + vh * 0.62 - mainTop;
    const tick = () => {
      raf = 0;
      if (!built || document.hidden) return;
      // Ghe trôi tới dòng đọc thay vì nhảy (thay cho transition cũ); dừng hẳn khi đã tới nơi.
      const d = target - cur;
      cur = cur < 0 || Math.abs(d) < 0.75 || Math.abs(d) > vh * 3 ? target : cur + d * 0.24;
      paint(cur);
      if (cur !== target) raf = requestAnimationFrame(tick);
    };
    const onScroll = () => { target = readLine(); if (!raf) raf = requestAnimationFrame(tick); };
    const listen = (on: boolean) => {
      if (on === listening) return;
      listening = on;
      if (on) { addEventListener('scroll', onScroll, { passive: true }); document.addEventListener('visibilitychange', onScroll); }
      else { removeEventListener('scroll', onScroll); document.removeEventListener('visibilitychange', onScroll); if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    };

    const build = () => {
      const W = main.clientWidth;
      H = main.scrollHeight;
      vh = innerHeight;
      const mr = main.getBoundingClientRect();
      mainTop = mr.top + scrollY;
      if (W < 1100) { root.setAttribute('data-off', ''); built = false; listen(false); stopAnims(); tilesBox.textContent = ''; front.textContent = ''; return; }
      root.removeAttribute('data-off');
      const top = (el: Element) => el.getBoundingClientRect().top + scrollY - mainTop;
      const box = (el: Element) => { const r = el.getBoundingClientRect(); return { t: r.top + scrollY - mainTop, h: r.height }; };
      const wrap = main.querySelector('.toc-x .wrap, .wrap');
      const wr = wrap ? wrap.getBoundingClientRect() : { left: W * 0.08, right: W * 0.92 };
      // Lề: giữa mép khung chữ và mép trang; không bao giờ đè lên cột chữ.
      // Dải thẻ cuộn ngang tràn ra quá khung chữ một chút: lấy mép thật của chúng làm ranh giới.
      const mr2 = main.getBoundingClientRect();
      let edgeL = wr.left - mr2.left, edgeR = wr.right - mr2.left;
      for (const t of main.querySelectorAll('.ch-track-list')) {
        const r = t.getBoundingClientRect();
        edgeL = Math.min(edgeL, Math.max(0, r.left - mr2.left)); edgeR = Math.max(edgeR, Math.min(W, r.right - mr2.left));
      }
      const L = Math.max(22, edgeL / 2), R = W - Math.max(22, (W - edgeR) / 2);
      // Màn hẹp: dải thẻ tràn tới mép phải, lề phải không còn chỗ. Khi đó sông chỉ men lề trái,
      // qua mỗi dải chuyển cảnh thì uốn ra giữa (dưới nút "Chương tiếp") rồi quay về bờ trái.
      const swap = W - edgeR >= 56;
      const hero = main.querySelector('.hx'), toc = main.querySelector('.toc-x'), ket = main.querySelector('#ket');
      const chapters = [...main.querySelectorAll<HTMLElement>('.ch[data-chapter]')];
      const tides = [...main.querySelectorAll<HTMLElement>('.ch-tide')];
      if (!hero || !toc || !chapters.length) { built = false; return; }
      const pts: Pt[] = [];
      const hb = box(hero), tb = box(toc);
      // Dòng ghi công ảnh nằm ngay dưới ảnh mở đầu: sông đi vòng dưới nó.
      // Đổ thẳng xuống ở bên trái chữ ghi công rồi mới vòng sang phải.
      const credit = main.querySelector('.hx-credit-row');
      let below = hb.t + hb.h + 24, x0 = W * 0.52;
      if (credit) {
        const cb = box(credit);
        const rg = document.createRange(); rg.selectNodeContents(credit);
        const textLeft = Math.min(...[...rg.getClientRects()].map(r => r.left - main.getBoundingClientRect().left), W);
        below = cb.t + cb.h + 26;
        x0 = Math.min(x0, textLeft - 44);
      }
      pts.push([x0, hb.t + hb.h - 70]);
      pts.push([x0, below]);
      pts.push(swap ? [W * 0.7, below + 34] : [L, below + 30]);
      pts.push([swap ? R : L, tb.t + tb.h * 0.5]);
      let side: 'R' | 'L' = swap ? 'R' : 'L';
      chapters.forEach((ch, i) => {
        const b = box(ch);
        const x = side === 'R' ? R : L, bend = side === 'R' ? -8 : 8;
        pts.push([x + bend, b.t + b.h * 0.3]);
        pts.push([x - bend * 0.5, b.t + b.h * 0.68]);
        const tide = tides[i];
        if (!tide) return;
        const tt = box(tide);
        const last = i === chapters.length - 1;
        // Nút "Chương tiếp" nằm giữa dải: sông men lề xuống quá đáy nút rồi mới vòng qua bên dưới,
        // chừa khoảng cho cả thân ghe, không bao giờ cắt ngang chữ.
        const pill = tide.querySelector('.ch-next a');
        const pb = pill ? box(pill) : { t: tt.t + tt.h * 0.35, h: 56 };
        const under = Math.min(pb.t + pb.h + 48, tt.t + tt.h - 46);
        pts.push([x, tt.t + 18]);
        if (swap || last) {
          // Xuống ngang đáy nút ở sát bờ rồi mới vòng vào giữa: dải chuyển cảnh thấp hơn trước, nét không cắt góc nút.
          pts.push([x + (W * 0.5 - x) * 0.14, pb.t + pb.h + 6]);
          pts.push([W * 0.5, under]);
        } else {
          // Màn hẹp: sông chỉ uốn một vòng cung ra phía trái nút, không cần vòng xuống dưới.
          const pl = pill ? pill.getBoundingClientRect().left - main.getBoundingClientRect().left : W * 0.35;
          pts.push([Math.max(L + 30, Math.min(W * 0.26, pl - 70)), tt.t + tt.h * 0.5]);
        }
        if (last) return;
        side = swap ? (side === 'R' ? 'L' : 'R') : 'L';
        pts.push([side === 'R' ? R : L, tt.t + tt.h - 18]);
      });
      if (ket) pts.push([W * 0.5, top(ket) + 56]);
      const d = smoothPath(pts);
      measure.setAttribute('d', d);
      // Màu theo nền: mỗi khối sáng/đậm cho hai điểm dừng ở mép trên và mép dưới; dải chuyển cảnh để gradient tự pha.
      grad.setAttribute('y2', String(H));
      grad.textContent = '';
      const blocks = [...main.children].filter(el => el !== root && !el.classList.contains('ch-tide') && el.getBoundingClientRect().height > 0);
      const stops: { y: number; c: string }[] = [];
      for (const el of blocks) {
        const b = box(el);
        const dark = el.classList.contains('is-alt') || el.classList.contains('hx');
        stops.push({ y: b.t, c: dark ? DARK : LIGHT }, { y: b.t + b.h, c: dark ? DARK : LIGHT });
      }
      stops.sort((a, b) => a.y - b.y);
      for (const st of stops) {
        const el = document.createElementNS(NS, 'stop');
        el.setAttribute('offset', String(Math.min(1, Math.max(0, st.y / H))));
        el.setAttribute('stop-color', st.c);
        grad.appendChild(el);
      }
      // Bảng điểm: mỗi ~4px dọc nét một điểm; góc lấy theo hai điểm kề nhau. Bảng này vừa để tra vị trí ghe,
      // vừa để cắt nét sông thành từng đoạn ngắn cho từng ô (mỗi ô chỉ vẽ phần sông của nó, không vẽ cả dòng 15.000px).
      const total = measure.getTotalLength();
      const N = Math.max(2, Math.ceil(total / 4));
      const step = total / N;
      xs = new Float32Array(N + 1); ys = new Float32Array(N + 1); as = new Float32Array(N + 1); my = new Float32Array(N + 1);
      let maxY = -Infinity;
      for (let i = 0; i <= N; i++) {
        const q = measure.getPointAtLength((total * i) / N);
        xs[i] = q.x; ys[i] = q.y; maxY = Math.max(maxY, q.y); my[i] = maxY;
      }
      for (let i = 0; i <= N; i++) {
        const a = Math.max(0, i - 1), b = Math.min(N, i + 1);
        as[i] = (Math.atan2(ys[b] - ys[a], xs[b] - xs[a]) * 180) / Math.PI;
      }
      // Ô sông: cao bằng một màn hình (SVG nhỏ, vẽ sẵn một lần). Nét chấm mờ luôn hiện; nét chính nằm trong một lớp
      // riêng, được mở dần bằng một khung cắt dịch theo dòng đọc, nên cuộn trang không phải vẽ lại gì.
      const T = Math.max(600, Math.round(vh));
      const n = Math.ceil(H / T);
      let backs = '', lines = '', i0 = 0;
      for (let k = 0; k < n; k++) {
        const t = k * T, h = Math.min(T, H - t);
        // Nét sông đi xuống đều (xem smoothPath), nên phần trong ô là một dải chỉ số liền nhau.
        while (i0 < N && my[i0 + 1] < t - 6) i0++;
        let i1 = i0;
        while (i1 < N && my[i1] <= t + h + 6) i1++;
        if (i1 - i0 < 1) continue;
        let seg = `M${xs[i0].toFixed(1)} ${ys[i0].toFixed(1)}`;
        for (let i = i0 + 1; i <= i1; i++) seg += `L${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`;
        const head = `<svg class="sr-tile" style="top:${t}px" viewBox="0 ${t} ${W} ${h}" width="${W}" height="${h}" focusable="false">`;
        // Nét chấm nối liền qua các ô: lệch pha theo độ dài đã đi tới đầu đoạn.
        backs += `${head}<path class="sr-back" style="stroke-dashoffset:${(-i0 * step).toFixed(1)}" d="${seg}"/></svg>`;
        lines += `${head}<path class="sr-line" d="${seg}"/></svg>`;
      }
      tilesBox.innerHTML = backs;
      front.innerHTML = lines;
      clip.style.height = `${H}px`;
      shown = -1;
      built = true; boatKey = '';
      if (still.matches) {
        // Giảm chuyển động: sông hiện đủ, ghe đậu ở cuối sông, không theo dõi cuộn, không animation nào.
        listen(false); stopAnims();
        paint(H + 1);
      } else if (drive()) {
        listen(false);
      } else {
        // Trình duyệt chưa có ScrollTimeline: JS theo cuộn, gộp theo khung hình, chỉ ghi transform khi đổi.
        listen(true);
        target = readLine(); cur = target; paint(cur);
      }
    };

    let timer = 0, lastW = -1, lastH = -1;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const W = main.clientWidth, H = main.scrollHeight;
        if (W === lastW && H === lastH && built) return;
        lastW = W; lastH = H;
        build();
      }, 160);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(main);
    // Đổi chiều cao cửa sổ thì quãng cuộn đổi theo: dựng lại mốc (đã gộp nhịp ở schedule).
    const onResize = () => { lastW = -1; schedule(); };
    addEventListener('resize', onResize);
    const onMotion = () => { lastW = -1; schedule(); };
    still.addEventListener('change', onMotion);
    lastW = main.clientWidth; lastH = main.scrollHeight;
    build();
    return () => { ro.disconnect(); removeEventListener('resize', onResize); window.clearTimeout(timer); still.removeEventListener('change', onMotion); listen(false); stopAnims(); };
  }, []);

  return (
    <div className="sr" ref={ref} aria-hidden="true" data-off="">
      <svg className="sr-defs" width="0" height="0" focusable="false">
        <defs><linearGradient id="sr-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000" /></defs>
        <path className="sr-measure" d="" />
      </svg>
      <div className="sr-tiles" />
      <div className="sr-clip"><div className="sr-front" /></div>
      {/* Ghe nhìn từ trên xuống: thân thoi dài, mui cong ở giữa, nón lá người chèo ở lái, vệt nước sau lái.
          Bóng ghe vẽ sẵn bằng một hình mờ dưới thân (không dùng filter). */}
      <span className="sr-boat">
        <svg viewBox="-34 -12 68 24" width="68" height="24">
          <path className="shade" d="M-29 2.5q6-6 24-6h12q18 0 24 6q-6 6-24 6h-12q-18 0-24-6z" />
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
