import { markText, paragraphs, voiceShift, type Milestone } from '@/lib/narrative';
import { sectionLabels } from '@/lib/editorial-model';

/**
 * Các mảnh trình bày kể chuyện cho trang hồ sơ (dựng ở máy chủ, đọc được trọn vẹn khi tắt JavaScript).
 * Chuyển động do components/interactive/dossier-motion.tsx bật lên, kiểu dáng ở app/design/narrative.css.
 */

/** Hình nhỏ cho từng giọng kể, vẽ bằng nét (pathLength=1 để nét tự vẽ ra khi mục hiện). */
export function KindGlyph({ kind }: { kind: string }) {
  const p = { pathLength: 1, className: 'nx-stroke' } as const;
  const art: Record<string, React.ReactNode> = {
    documented_history: <><path {...p} d="M7 4h11l5 5v15H7z" /><path {...p} d="M18 4v5h5M10 14h10M10 18h10M10 22h6" /></>,
    observed_practice: <><path {...p} d="M2 15s5-8 13-8 13 8 13 8-5 8-13 8S2 15 2 15z" /><circle {...p} cx="15" cy="15" r="4" /></>,
    folk_belief: <><path {...p} d="M15 3c4 5 9 7 9 13a9 9 0 0 1-18 0c0-6 5-8 9-13z" /><path {...p} d="M11 18c1 3 5 4 7 1" /></>,
    hypothesis: <><path {...p} d="M10 10a5 5 0 1 1 7 4.6c-1.3.6-2 1.6-2 3V20" /><path {...p} d="M15 24.5v.5" /></>,
    explanation: <><path {...p} d="M5 6h20v14H13l-6 5v-5H5z" /><path {...p} d="M10 11h10M10 15h6" /></>,
    editorial_note: <><path {...p} d="M6 24l2-6L20 6l4 4-12 12z" /><path {...p} d="M17 9l4 4" /></>,
    legend: <><path {...p} d="M15 3l3.4 7 7.6 1-5.5 5.3 1.3 7.6L15 20.3l-6.8 3.6 1.3-7.6L4 11l7.6-1z" /></>,
    anecdote: <><path {...p} d="M4 8h14v10H9l-5 4zM18 12h8v9l-4-3h-6" /></>,
    community_memory: <><circle {...p} cx="11" cy="10" r="4" /><circle {...p} cx="21" cy="12" r="3" /><path {...p} d="M3 25c1-5 4-8 8-8s7 3 8 8M18 25c.5-3 2-6 6-6s4 3 4 6" /></>,
  };
  return <svg className="nx-glyph" viewBox="0 0 30 30" width="30" height="30" aria-hidden="true" fill="none">{art[kind] ?? art.explanation}</svg>;
}

/** Lời văn của một mục: tách đoạn, nhấn năm, con số có đơn vị và tên gọi trong ngoặc kép. Chữ giữ nguyên. */
export function NarrativeText({ text, dropCap = false }: { text: string; dropCap?: boolean }) {
  return (
    <div className="nx-text">
      {paragraphs(text).map((para, i) => (
        <p key={i} className={`preserve ${dropCap && i === 0 ? 'nx-dropcap' : ''}`}>
          {markText(para).map((m, j) => m.type ? <mark key={j} className={`nx-mark is-${m.type}`}>{m.text}</mark> : m.text)}
        </p>
      ))}
    </div>
  );
}

/** Lằn chuyển giọng giữa hai mục khác loại: người đọc thấy rõ mình vừa bước sang giả thuyết, sang lời kể. */
export function VoiceShift({ kind }: { kind: string }) {
  const text = voiceShift[kind];
  if (!text) return null;
  return (
    <div className={`nx-shift kind-${kind}`} data-nx role="presentation">
      <span className="nx-shift-line" aria-hidden="true" />
      <span className="nx-shift-copy"><KindGlyph kind={kind} /><span>{text}</span></span>
      <span className="nx-shift-line" aria-hidden="true" />
    </div>
  );
}

/** Dòng thời gian của bài: mỗi mốc là một câu trích nguyên văn, bấm để đọc đúng mục. */
export function Milestones({ items }: { items: Milestone[] }) {
  if (!items.length) return null;
  const first = items[0].year, last = items[items.length - 1].year;
  return (
    <section className="nx-timeline" aria-labelledby="moc-thoi-gian" id="dong-thoi-gian" data-nx>
      <header className="nx-timeline-head">
        <p className="eyebrow">Đọc nhanh</p>
        <h2 id="moc-thoi-gian">{items.length} mốc thời gian trong bài</h2>
        <p>Từ {first} đến {last}. Mỗi mốc là một câu trích nguyên văn từ các mục bên dưới; nguồn của câu ấy ghi ở cuối mục.</p>
      </header>
      <ol className="nx-tl">
        {items.map((m, i) => (
          <li key={m.year} className="nx-tl-item" data-nx style={{ '--i': i } as React.CSSProperties}>
            <span className="nx-tl-dot" aria-hidden="true" />
            <p className="nx-tl-year">
              <span className="sr-only">{m.year}</span>
              <span aria-hidden="true" data-count={m.year} data-from={i ? items[i - 1].year : m.year - 24}>{m.year}</span>
            </p>
            <blockquote className="nx-tl-quote">
              {markText(m.quote).map((x, j) => x.type === 'year' && x.text === m.label ? <mark key={j} className="nx-mark is-year">{x.text}</mark> : x.text)}
            </blockquote>
            <a className="nx-tl-link" href={`#muc-${m.section + 1}`}>Mục {m.section + 1}: {m.heading} <span aria-hidden="true">↓</span></a>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Đầu một mục: số mục lớn, hình giọng kể, nhãn kiểm chứng. */
export function SectionHead({ index, total, kind }: { index: number; total: number; kind: string }) {
  return (
    <div className="nx-head">
      <span className="nx-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}<small>/{String(total).padStart(2, '0')}</small></span>
      <span className={`nx-kind kind-${kind}`}><KindGlyph kind={kind} /><span className={`epistemic-label kind-${kind}`}>{sectionLabels[kind as keyof typeof sectionLabels] ?? kind}</span></span>
    </div>
  );
}

/** Tiêu đề hồ sơ hiện từng chữ một. Tiêu đề nguyên vẹn cho trình đọc màn hình và khi tắt chuyển động. */
export function WordsRise({ text }: { text: string }) {
  const words = text.split(/\s+/);
  return <>{words.map((w, i) => <span key={i} className="nx-word" style={{ '--i': Math.min(i, 14) } as React.CSSProperties}>{w}{i < words.length - 1 ? ' ' : ''}</span>)}</>;
}
