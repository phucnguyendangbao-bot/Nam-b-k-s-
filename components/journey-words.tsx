import type { LiteraryPassage } from '@/lib/journey-literature';

/** A verse always renders its checked text; editorial prose keeps the project's own byline. */
export function JourneyWords({ text, epigraph, allusion, className = '' }: { text: string; epigraph?: LiteraryPassage; allusion?: LiteraryPassage; className?: string }) {
  const verse = epigraph?.kind === 'verse' ? epigraph : undefined;
  const note = verse ?? (allusion?.kind === 'allusion' ? allusion : undefined);
  return <figure className={`journey-words ${verse ? 'journey-verse' : ''} ${className}`} data-provenance={verse ? 'literary-excerpt' : 'editorial'}>
    <blockquote><p>{verse?.text ?? text}</p></blockquote>
    <figcaption>
      {verse ? <span>{verse.author} · <cite>{verse.work}</cite></span> : <span>Lời dẫn · Nam Bộ Ký Sự</span>}
      {note && <details className="journey-literary-note"><summary>{verse ? 'Xuất xứ câu thơ' : `Điển tích: ${note.text}`}</summary><p>{note.context}</p><a href={note.sourceUrl} target="_blank" rel="noreferrer">{note.work} · {note.locator} ↗</a></details>}
    </figcaption>
  </figure>;
}
