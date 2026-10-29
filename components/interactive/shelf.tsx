'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { SpringValue, VelocityTracker, project, rubberband, springs } from '@/lib/spring';

/**
 * Kệ cuộn ngang kiểu Apple Store.
 * - Cảm ứng, bàn di chuột: cuộn gốc của trình duyệt (đã có quán tính và scroll-snap của hệ điều hành).
 * - Chuột: kéo 1:1 giữ đúng chỗ nắm, ngưỡng 10px; thả ra thì chiếu quán tính tới thẻ gần điểm dừng dự kiến
 *   và nối vận tốc vào lò xo. Kéo quá hai đầu thì cản dần (rubber-band) rồi bật về.
 * - Nút ‹ › cuộn một trang, chạy bằng lò xo nên bấm liên tiếp hay đổi chiều giữa chừng vẫn liền mạch.
 */
export function Shelf({ label, children, className = '', focusable = false }: { label: string; children: React.ReactNode; className?: string; /** Bật khi trong kệ không có liên kết hay nút, để người dùng bàn phím vẫn cuộn được. */ focusable?: boolean }) {
  const id = useId();
  const list = useRef<HTMLUListElement>(null);
  const spring = useRef<SpringValue | null>(null);
  const animating = useRef(false);
  const tracker = useRef(new VelocityTracker());
  const drag = useRef<{ pointer: number; x: number; start: number; active: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [edges, setEdges] = useState({ start: true, end: false });

  const max = () => { const el = list.current; return el ? Math.max(0, el.scrollWidth - el.clientWidth) : 0; };

  /** Vị trí ảo có thể vượt biên: phần trong biên là scrollLeft, phần vượt hiển thị bằng lực cản. */
  const apply = useCallback((p: number) => {
    const el = list.current; if (!el) return;
    const m = max();
    const inside = Math.min(Math.max(p, 0), m);
    el.scrollLeft = inside;
    const over = p - inside;
    el.style.setProperty('--shelf-over', over ? `${-rubberband(over, el.clientWidth)}px` : '0px');
  }, []);

  const measure = useCallback(() => {
    const el = list.current; if (!el) return;
    const m = max();
    setEdges(prev => {
      const next = { start: el.scrollLeft <= 2, end: el.scrollLeft >= m - 2 };
      return prev.start === next.start && prev.end === next.end ? prev : next;
    });
  }, []);

  useEffect(() => {
    const el = list.current; if (!el) return;
    spring.current = new SpringValue(el.scrollLeft, apply);
    let frame = 0;
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; measure(); }); };
    // Người đọc tự cuộn (bánh xe, chạm) thì nhường ngay: dừng lò xo, không giành quyền.
    const yieldToUser = () => { if (animating.current) settle(); };
    measure();
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', yieldToUser, { passive: true });
    el.addEventListener('touchstart', yieldToUser, { passive: true });
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => { el.removeEventListener('scroll', onScroll); el.removeEventListener('wheel', yieldToUser); el.removeEventListener('touchstart', yieldToUser); ro.disconnect(); spring.current?.stop(); cancelAnimationFrame(frame); };
  }, [apply, measure]);

  function settle() {
    spring.current?.stop();
    animating.current = false;
    list.current?.classList.remove('is-animating');
    list.current?.style.setProperty('--shelf-over', '0px');
  }

  /** Các điểm dừng: mép trái từng thẻ, căn theo lề nội dung (scroll-padding). */
  function snapPoints() {
    const el = list.current; if (!el) return [0];
    const pad = parseFloat(getComputedStyle(el).scrollPaddingInlineStart) || 0;
    const m = max();
    const pts = Array.from(el.children).map(li => Math.min(Math.max((li as HTMLElement).offsetLeft - pad, 0), m));
    return Array.from(new Set([0, ...pts, m])).sort((a, b) => a - b);
  }
  const nearest = (x: number) => snapPoints().reduce((best, p) => (Math.abs(p - x) < Math.abs(best - x) ? p : best), 0);

  function animateTo(target: number, velocity: number, config: { damping: number; response: number } = springs.ui) {
    const el = list.current, s = spring.current; if (!el || !s) return;
    if (!animating.current) { s.value = el.scrollLeft; s.velocity = 0; }
    animating.current = true;
    el.classList.add('is-animating');
    s.to(target, { ...config, velocity, onRest: () => { settle(); measure(); } });
  }

  /** Một trang = bề rộng nhìn thấy, rồi bám vào thẻ gần nhất phía trước. Bấm tiếp khi đang chạy thì cộng dồn từ đích cũ. */
  function page(dir: 1 | -1) {
    const el = list.current, s = spring.current; if (!el || !s) return;
    const from = animating.current ? s.destination : el.scrollLeft;
    const pts = snapPoints();
    const goal = from + dir * el.clientWidth * 0.86;
    const target = dir > 0 ? (pts.filter(p => p <= goal + 1).pop() ?? max()) : (pts.find(p => p >= goal - 1) ?? 0);
    const next = target === from ? (dir > 0 ? pts.find(p => p > from + 1) ?? max() : [...pts].reverse().find(p => p < from - 1) ?? 0) : target;
    animateTo(next, animating.current ? s.velocity : 0);
  }

  function onPointerDown(e: React.PointerEvent<HTMLUListElement>) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = list.current; if (!el) return;
    // Nắm lại khi đang trôi: bắt ngay tại vị trí đang hiển thị, không giật.
    const current = animating.current && spring.current ? spring.current.value : el.scrollLeft;
    if (animating.current) { spring.current?.stop(); animating.current = false; }
    drag.current = { pointer: e.pointerId, x: e.clientX, start: current, active: false };
    tracker.current.reset();
    tracker.current.add(current);
  }
  function onPointerMove(e: React.PointerEvent<HTMLUListElement>) {
    const d = drag.current, el = list.current;
    if (!d || !el || e.pointerId !== d.pointer) return;
    const dx = e.clientX - d.x;
    if (!d.active) {
      if (Math.abs(dx) < 10) return;
      d.active = true;
      d.x = e.clientX - Math.sign(dx) * 10; // giữ đúng chỗ nắm sau ngưỡng, không nhảy 10px
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-dragging', 'is-animating');
    }
    const p = d.start - (e.clientX - d.x);
    tracker.current.add(p);
    if (spring.current) spring.current.value = p;
    apply(p);
  }
  function onPointerUp(e: React.PointerEvent<HTMLUListElement>) {
    const d = drag.current, el = list.current;
    drag.current = null;
    if (!d || !el || !d.active) return;
    el.classList.remove('is-dragging');
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    suppressClick.current = true;
    window.setTimeout(() => { suppressClick.current = false; }, 350);
    const v = e.type === 'pointercancel' ? 0 : tracker.current.velocity();
    const p = spring.current?.value ?? el.scrollLeft;
    const m = max();
    const outside = p < 0 || p > m;
    const target = outside ? (p < 0 ? 0 : m) : nearest(Math.min(Math.max(p + project(v), 0), m));
    // Có quán tính thì cho phép nảy nhẹ; kéo chậm thì về chỗ không nảy.
    const config = Math.abs(v) > 300 ? springs.flick : springs.ui;
    if (spring.current) { spring.current.value = p; spring.current.velocity = v; }
    animating.current = true;
    animateTo(target, v, config);
  }

  return (
    <div className={`shelf ${className}`}>
      <ul
        ref={list}
        id={id}
        className="shelf-track"
        aria-label={label}
        tabIndex={focusable ? 0 : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDragStart={e => e.preventDefault()}
        onClickCapture={e => { if (suppressClick.current) { suppressClick.current = false; e.preventDefault(); e.stopPropagation(); } }}
      >
        {children}
      </ul>
      {(
        <div className={`shelf-paddles ${edges.start && edges.end ? 'is-idle' : ''}`}>
          <button type="button" className="shelf-paddle" aria-controls={id} aria-label={`${label}: xem mục trước`} disabled={edges.start} onClick={() => page(-1)}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" className="shelf-paddle" aria-controls={id} aria-label={`${label}: xem mục tiếp`} disabled={edges.end} onClick={() => page(1)}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
