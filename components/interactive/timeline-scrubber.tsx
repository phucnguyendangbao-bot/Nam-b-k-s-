'use client';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { markText, type Milestone } from '@/lib/narrative';

const STEP = 6500;
const noop = () => () => {};
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Dòng thời gian gọn: một trục năm nằm ngang, mỗi lần hiện một câu trích.
 * Tự chuyển mốc khi khối nằm trong màn hình (dừng khi rê chuột, khi bấm, khi giảm chuyển động).
 * Không JS: mọi câu trích hiện thành danh sách bên dưới trục (xem .nx-scrub:not(.is-live) trong narrative.css).
 */
export function TimelineScrubber({ items }: { items: Milestone[] }) {
  const [active, setActive] = useState(0);
  // Đã chạy trên trình duyệt (khác với lúc dựng ở máy chủ); không cần setState trong effect.
  const live = useSyncExternalStore(noop, () => true, () => false);
  const still = useSyncExternalStore(noop, reducedMotion, () => true);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [dir, setDir] = useState(1);
  const root = useRef<HTMLElement>(null);
  const first = items[0].year, last = items[items.length - 1].year, span = Math.max(1, last - first);

  useEffect(() => {
    const el = root.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.45 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = useCallback((i: number, stop = true) => {
    setActive(cur => { setDir(i >= cur ? 1 : -1); return (i + items.length) % items.length; });
    if (stop) setPlaying(false);
  }, [items.length]);

  useEffect(() => {
    if (!live || still || !playing || !visible) return;
    const t = window.setTimeout(() => go(active + 1, false), STEP);
    return () => window.clearTimeout(t);
  }, [active, live, still, playing, visible, go]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
  };
  // Vị trí trên trục theo đúng khoảng cách năm, nhưng giữ tối thiểu một khoảng để các mốc gần nhau không chồng lên.
  const pos = items.map((x, i) => 0.7 * ((x.year - first) / span) + 0.3 * (i / Math.max(1, items.length - 1)));

  // Nhãn năm chỉ hiện khi đủ chỗ (cách nhãn trước ít nhất 8% trục); năm đang chọn luôn có nhãn.
  const labelled = pos.map(() => false);
  let prev = -1;
  pos.forEach((p, i) => { if (prev < 0 || p - pos[prev] >= 0.08) { labelled[i] = true; prev = i; } });
  const L = pos.length - 1;
  if (!labelled[L]) { labelled[L] = true; for (let i = L - 1; i > 0 && pos[L] - pos[i] < 0.08; i--) labelled[i] = false; }

  return (
    <section ref={root} className={`nx-timeline nx-scrub ${live ? 'is-live' : ''}`} aria-labelledby="moc-thoi-gian" id="dong-thoi-gian" data-nx
      onMouseEnter={() => setPlaying(false)} data-playing={live && !still && playing && visible ? 'true' : undefined}>
      <header className="nx-scrub-head">
        <div>
          <p className="eyebrow">Đọc nhanh · {items.length} mốc</p>
          <h2 id="moc-thoi-gian">{first} → {last}</h2>
        </div>
        {live && (
          <div className="nx-scrub-ctl">
            <button type="button" onClick={() => go(active - 1)} aria-label="Mốc trước">←</button>
            <button type="button" onClick={() => setPlaying(p => !p)} aria-label={playing && !still ? 'Dừng tự chuyển' : 'Tự chuyển mốc'}>{playing && !still ? '❚❚' : '▶'}</button>
            <button type="button" onClick={() => go(active + 1)} aria-label="Mốc sau">→</button>
          </div>
        )}
      </header>

      <div className="nx-axis" role="tablist" aria-label="Các năm" onKeyDown={onKey}>
        <span className="nx-axis-line" aria-hidden="true"><i style={{ scale: `${pos[active]} 1` }} /></span>
        {items.map((x, i) => (
          <button key={x.year} type="button" role="tab" id={`moc-tab-${x.year}`} aria-controls={`moc-${x.year}`} aria-selected={i === active} tabIndex={i === active ? 0 : -1}
            className={`nx-axis-dot ${i === active ? 'is-on' : ''} ${i < active ? 'is-past' : ''} ${labelled[i] ? 'has-label' : ''}`} style={{ left: `${pos[i] * 100}%`, '--i': i } as React.CSSProperties} onClick={() => go(i)}>
            <span>{x.year}</span>
          </button>
        ))}
      </div>

      <div className="nx-stage">
        {items.map((x, i) => (
          <article key={x.year} id={`moc-${x.year}`} role="tabpanel" aria-labelledby={`moc-tab-${x.year}`} hidden={live && i !== active ? true : undefined}
            className={`nx-panel ${dir < 0 ? 'from-left' : ''}`}>
            <p className="nx-panel-year" aria-hidden={live ? true : undefined}>{x.year}</p>
            <div className="nx-panel-body">
              <blockquote>{markText(x.quote).map((t, j) => t.type === 'year' && t.text === x.label ? <mark key={j} className="nx-mark is-year">{t.text}</mark> : t.text)}</blockquote>
              <a className="nx-tl-link" href={`#muc-${x.section + 1}`}>Mục {x.section + 1}: {x.heading} <span aria-hidden="true">↓</span></a>
            </div>
          </article>
        ))}
        {live && <span className="nx-timer" key={`${active}-${playing && visible}`} aria-hidden="true" />}
      </div>
    </section>
  );
}
