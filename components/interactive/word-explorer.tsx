'use client';
import { useRef, useState } from 'react';

export type ExplorerWord = { id: string; headword: string; meaning: string; pos?: string | null; example?: string | null; href: string };

/**
 * Chọn một từ, xem ngay nghĩa và ví dụ. Dùng mẫu tablist chuẩn: mũi tên trái/phải đổi từ, Home/End về đầu/cuối.
 * Không hover-only: mọi thao tác đều là bấm hoặc phím.
 */
export function WordExplorer({ words }: { words: ExplorerWord[] }) {
  const [i, setI] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const w = words[i];
  if (!w) return null;
  const go = (n: number) => { const k = (n + words.length) % words.length; setI(k); tabs.current[k]?.focus(); };
  return (
    <div className="wx">
      <div className="wx-tabs" role="tablist" aria-label="Chọn một từ phương ngữ">
        {words.map((x, k) => (
          <button
            key={x.id} ref={el => { tabs.current[k] = el; }} type="button" role="tab" id={`wx-tab-${x.id}`} aria-controls="wx-panel"
            aria-selected={k === i} tabIndex={k === i ? 0 : -1} className="wx-tab" onClick={() => setI(k)}
            onKeyDown={e => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(i + 1); }
              else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(i - 1); }
              else if (e.key === 'Home') { e.preventDefault(); go(0); }
              else if (e.key === 'End') { e.preventDefault(); go(words.length - 1); }
            }}
          >{x.headword}</button>
        ))}
      </div>
      <div className="wx-panel" role="tabpanel" id="wx-panel" aria-labelledby={`wx-tab-${w.id}`} key={w.id}>
        <p className="wx-word" lang="vi">{w.headword}</p>
        {w.pos && <p className="wx-pos">{w.pos}</p>}
        <p className="wx-meaning">{w.meaning}</p>
        {w.example && (
          <blockquote className="wx-example">
            <p>“{w.example}”</p>
            <footer>Câu ví dụ do ban biên soạn đặt, không phải trích dẫn.</footer>
          </blockquote>
        )}
        <a className="text-link" href={w.href}>Xem mục từ “{w.headword}” và nguồn <span aria-hidden="true">→</span></a>
      </div>
    </div>
  );
}
