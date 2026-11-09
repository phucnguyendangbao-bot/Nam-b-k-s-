'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { JourneyScene, type JourneyPhoto } from './journey-scene';
import { useJourneyProgress } from './use-journey-progress';
import { sectionLabels, type ArticleSection } from '@/lib/editorial-model';
import { JourneyWords } from '../journey-words';
import type { LiteraryPassage } from '@/lib/journey-literature';

export type ReadingStop = {
  id: string; title: string; slug: string; summary: string; scope: string; photo: JourneyPhoto;
  sections: ArticleSection[]; chapter?: { name: string; href: string };
  sources: { id: string; name: string; url: string }[];
  connected: { title: string; href: string }[];
  arrival?: string; departure?: string; allusion?: LiteraryPassage;
};
type Props = { slug: string; title: string; description: string; closing?: string; epigraph?: LiteraryPassage; stops: ReadingStop[]; initialStop?: string };

export function JourneyReader({ slug, title, description, closing, epigraph, stops, initialStop }: Props) {
  const [active, setActive] = useState(() => Math.max(0, stops.findIndex(stop => stop.id === initialStop)));
  const root = useRef<HTMLDivElement>(null);
  const { saved, save } = useJourneyProgress(slug, stops.map(stop => stop.id));
  const savedIndex = stops.findIndex(stop => stop.id === saved);
  const stop = stops[active];
  const go = useCallback((index: number, history = true) => {
    index = Math.max(0, Math.min(stops.length - 1, index));
    setActive(index);
    save(stops[index].id);
    if (history) {
      const url = new URL(window.location.href);
      url.searchParams.set('chang', stops[index].id);
      window.history.pushState(null, '', url);
    }
  }, [save, stops]);
  useEffect(() => {
    const restore = () => {
      const id = new URLSearchParams(window.location.search).get('chang');
      const index = stops.findIndex(stop => stop.id === id);
      go(Math.max(0, index), false);
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [go, stops]);
  const keyDown = (event: React.KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); go(active + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(active - 1); }
  };
  if (!stop) return null;
  return <div className="jr" ref={root} onKeyDown={keyDown}>
    <header className="jr-hero">
      <JourneyScene photo={stop.photo} next={stops[active + 1]?.photo} />
      <div className="jr-hero-copy">
        <p className="journey-eyebrow">MỘT HÀNH TRÌNH ĐỂ ĐỌC CHẬM · {stops.length} ĐIỂM DỪNG</p>
        <h1>{title}</h1><p>{description}</p>
        <a className="journey-cta" href="#journey-reading">Đi vào câu chuyện <span aria-hidden="true">↘</span></a>
        {savedIndex >= 0 && savedIndex !== active && <button className="journey-resume" type="button" onClick={() => go(savedIndex)}>Đọc tiếp nơi đã dừng · Chặng {savedIndex + 1} →</button>}
      </div>
    </header>
    <nav className="jr-itinerary" aria-label="Các điểm dừng của hành trình">
      {stops.map((item, index) => <button type="button" key={item.id} className={index === active ? 'is-active' : ''} aria-current={index === active ? 'step' : undefined} onClick={() => go(index)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.photo.src} alt="" loading="lazy" /><b>{String(index + 1).padStart(2, '0')}</b><span>{item.title}</span>
      </button>)}
    </nav>
    <div className="jr-layout" id="journey-reading">
      <aside className="jr-context">
        <p className="journey-eyebrow">ĐANG Ở CHẶNG {String(active + 1).padStart(2, '0')} / {String(stops.length).padStart(2, '0')}</p>
        <div className="jr-progress" role="progressbar" aria-label="Vị trí trong hành trình" aria-valuemin={1} aria-valuemax={stops.length} aria-valuenow={active + 1}><span style={{ width: `${(active + 1) / stops.length * 100}%` }} /></div>
        {stop.chapter && <a href={stop.chapter.href}>Trong chương {stop.chapter.name} ↗</a>}
        <p>Mỗi điểm dừng mở ra một góc nhìn. Bạn có thể đọc lần lượt hoặc tự chọn đường đi qua các hồ sơ.</p>
        <a href={`/ho-so/${stop.slug}`}>Mở hồ sơ đầy đủ & nguồn ↗</a>
        {stop.connected.length > 0 && <div className="jr-connections"><h3>Từ đây, đi tiếp</h3>{stop.connected.map(link => <a href={link.href} key={link.href}>{link.title} <span aria-hidden="true">↗</span></a>)}</div>}
      </aside>
      <article key={stop.id} className="jr-article">
        <p className="journey-eyebrow">ĐIỂM DỪNG {String(active + 1).padStart(2, '0')}</p><h2>{stop.title}</h2>
        {stop.arrival && <JourneyWords text={stop.arrival} epigraph={active === 0 ? epigraph : undefined} allusion={stop.allusion} />}
        {active === 0 && epigraph && stop.arrival && <p className="jr-arrival-prose">{stop.arrival}</p>}
        <p className="jr-summary">{stop.summary}</p>
        <details className="jr-scope"><summary>Phạm vi tư liệu của hồ sơ</summary><p>{stop.scope}</p></details>
        {/* Mục đầu mở sẵn, các mục sau gấp lại thành một dòng tiêu đề để chặng đọc gọn. */}
        {stop.sections.map((section, index) => <section key={index}><details className="jr-fold" open={index === 0}>
          <summary><p className="jr-section-kind">{sectionLabels[section.kind]}</p><h3>{section.heading}</h3></summary><p>{section.text}</p>
          <div className="jr-citations">{section.sourceIds.map(id => {
            const source = stop.sources.find(source => source.id === id);
            return source ? <a key={id} href={source.url} title={source.name} target="_blank" rel="noreferrer">{id} ↗</a> : null;
          })}</div>
        </details></section>)}
        {(active < stops.length - 1 ? stop.departure : closing) && <div className="jr-bridge"><p className="journey-eyebrow">{active < stops.length - 1 ? 'MẠCH CHUYỆN ĐI TIẾP' : 'MANG THEO SAU CHUYẾN ĐI'}</p><p>{active < stops.length - 1 ? stop.departure : closing}</p></div>}
        <nav className="jr-next" aria-label="Chuyển điểm dừng">
          <button type="button" disabled={active === 0} onClick={() => go(active - 1)}>← Chặng trước</button>
          {active < stops.length - 1 ? <button type="button" onClick={() => go(active + 1)}><small>CÂU CHUYỆN TIẾP THEO</small><strong>{stops[active + 1].title} →</strong></button>
            : <a href="/hanh-trinh"><small>BẠN ĐÃ ĐỌC ĐẾN CUỐI HÀNH TRÌNH</small><strong>Chọn một hành trình khác →</strong></a>}
        </nav>
      </article>
    </div>
  </div>;
}
