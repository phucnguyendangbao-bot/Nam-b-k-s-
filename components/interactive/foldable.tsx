'use client';
import { useEffect, useRef, useState } from 'react';

/** Chiều cao khi thu gọn, tính theo cỡ chữ đọc (khớp với .nx-text.is-folded trong narrative.css). */
const FOLD_EM = 10;

/**
 * Lời văn một mục, thu còn vài dòng đầu nếu dài; nút "Đọc tiếp" mở có chuyển động chiều cao.
 * Trạng thái do React giữ (không sửa thẳng DOM), nên không bị ghi đè khi hydrate.
 * Không JS thì hiện đủ. Liên kết tới mục (#muc-n) phát sự kiện `nx-unfold` để mở mục đó.
 */
export function Foldable({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [can, setCan] = useState(false);
  const [open, setOpen] = useState(false);
  const [maxH, setMaxH] = useState<string | undefined>(undefined);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      const limit = parseFloat(getComputedStyle(el).fontSize) * FOLD_EM;
      if (el.scrollHeight >= limit * 1.3) setCan(true);
    });
    const onUnfold = () => toggle(true);
    el.addEventListener('nx-unfold', onUnfold);
    return () => { cancelAnimationFrame(raf); el.removeEventListener('nx-unfold', onUnfold); };
  });

  function toggle(next: boolean) {
    const el = box.current;
    if (!el) return;
    setMaxH(`${el.scrollHeight}px`);
    if (next) {
      setOpen(true);
      window.setTimeout(() => setMaxH('none'), 750);
    } else {
      requestAnimationFrame(() => { setOpen(false); setMaxH(undefined); });
      const section = el.closest('section');
      if (section && section.getBoundingClientRect().top < 0) section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }

  return (
    <div ref={box} className={`nx-text ${can ? 'is-folded' : ''} ${open ? 'is-open' : ''}`} data-fold style={maxH ? { maxHeight: maxH } : undefined}>
      {children}
      {can && (
        <button type="button" className="nx-fold-btn" aria-expanded={open} onClick={() => toggle(!open)}>
          <span>{open ? 'Thu gọn' : 'Đọc tiếp'}</span><i aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
