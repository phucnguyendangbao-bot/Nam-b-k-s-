import Image from 'next/image';
import { Breadcrumb } from './site';
import { MapTourCards } from './map-tour-page';
import { JourneyReader, type ReadingStop } from './interactive/journey-reader';
import { contentCitations, tourStops, type Row } from '@/lib/static-data';
import { parseSections } from '@/lib/editorial-model';
import { journeyPhoto } from '@/lib/journey';
import { chapterAnchor, storyImages, storyPosition } from '@/lib/story';
import { mapToursFor } from '@/lib/map-tours';
import { journeyArrivalAllusions, journeyArrivals, journeyNarratives, journeyWelcome } from '@/lib/journey-narrative';
import { JourneyWords } from './journey-words';
import { journeyLiterature } from '@/lib/journey-literature';

export function JourneyIndex({ tours, allTours, contents, filter }: { tours: Row[]; allTours: Row[]; contents: Row[]; filter?: string }) {
  const hero = storyImages.prologue;
  const showMap = !filter || filter === 'physical';
  return <main id="main" className="journey-index">
    <header className="journey-hub-hero">
      <Image src={hero.url} alt={hero.alt} fill preload loading="eager" sizes="100vw" />
      <div className="journey-hub-shade" />
      <div className="journey-hub-copy"><Breadcrumb items={[{ label: 'Hành trình' }]} /><p className="journey-eyebrow">ĐI QUA MỘT VÙNG ĐẤT. CHẠM VÀO MỘT CÂU CHUYỆN.</p>
        <h1>Để miền Nam<br /><em>dẫn lối.</em></h1>
        <p>{journeyWelcome.opening}</p>
        <a href="#journey-choose" className="journey-cta">Chọn cách khám phá <span aria-hidden="true">↓</span></a>
      </div><a className="journey-credit" href={hero.source_url} target="_blank" rel="noreferrer">{hero.author} · {hero.license_name} ↗</a>
    </header>
    <div className="journey-hub-body" id="journey-choose">
      <div className="journey-prologue"><JourneyWords text={journeyWelcome.quote} epigraph={journeyLiterature[journeyWelcome.epigraph]} /><p>{journeyWelcome.invitation}</p></div>
      <div className="journey-hub-heading"><div><p className="journey-eyebrow">MỖI HÀNH TRÌNH, MỘT MẠCH KỂ</p><h2>Bạn muốn bắt đầu từ đâu?</h2></div><p>Xem ảnh, nghe thuyết minh và định vị trên bản đồ. Hoặc đọc sâu, theo từng hồ sơ có nguồn.</p></div>
      <nav className="filter-tabs" aria-label="Loại hành trình">{[['', 'Tất cả'], ['physical', 'Ảnh, âm thanh & bản đồ'], ['digital', 'Hành trình đọc']].map(([value, label]) => <a key={value} aria-current={(filter ?? '') === value ? 'page' : undefined} className={(filter ?? '') === value ? 'active' : ''} href={`/hanh-trinh${value ? `?loai=${value}` : ''}#journey-choose`}>{label}</a>)}</nav>
      {showMap && <section className="journey-featured"><div className="journey-section-head"><h2>Đi giữa những khung hình thật.</h2><p>Chọn từng điểm dừng, nghe câu chuyện rồi mở bản đồ để nhìn toàn tuyến.</p></div><MapTourCards /></section>}
      {tours.length > 0 && <section className="journey-reading-tours"><div className="journey-section-head"><h2>Đọc một nơi. Hiểu thêm nhiều điều.</h2><p>Các hành trình nối hồ sơ theo chủ đề, dành cho việc khám phá từ xa.</p></div><div className="journey-reading-grid">{tours.map((tour, index) => {
        const entries = (tour.content_ids as string[] ?? []).map(id => contents.find(content => content.id === id)).filter((row): row is Row => Boolean(row));
        const entry = entries.find(row => row.image_url) ?? entries[0];
        const photo = entry ? journeyPhoto(entry) : { src: hero.url, alt: hero.alt, context: true };
        return <a className="journey-reading-card" href={`/hanh-trinh/${tour.slug}`} key={tour.id}>
          <div className="journey-card-photo"><Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 700px) 100vw, 50vw" unoptimized={photo.src.startsWith('https:')} /><span>{photo.context ? 'Ảnh bối cảnh' : 'Ảnh tư liệu'}</span></div>
          <div className="journey-card-copy"><span className="journey-eyebrow">HÀNH TRÌNH {String(index + 1).padStart(2, '0')} · {tour.stop_count} ĐIỂM DỪNG</span><h3>{tour.title}</h3><p>{journeyNarratives[String(tour.id)]?.quote ?? tour.description}</p><span className="journey-card-arrow" aria-hidden="true">↗</span></div>
        </a>;
      })}</div></section>}
      {!tours.length && !showMap && <p className="notice">Chưa có hành trình thuộc nhóm này. <a href="/hanh-trinh">Xem tất cả {allTours.length} hành trình đọc →</a></p>}
    </div>
  </main>;
}

export async function ReadingJourneyPage({ tour, allTours, initialStop }: { tour: Row; allTours: Row[]; initialStop?: string }) {
  const rows = await tourStops(tour.id);
  const narrative = journeyNarratives[String(tour.id)];
  const stops: ReadingStop[] = await Promise.all(rows.map(async (row, index) => {
    const chapter = storyPosition(String(row.id))?.chapter;
    const citations = await contentCitations(String(row.id));
    const connections = allTours.filter(other => other.id !== tour.id && other.content_ids?.includes(row.id)).slice(0, 2).map(other => ({ title: String(other.title), href: `/hanh-trinh/${other.slug}` }));
    for (const { tour: mapTour, index } of mapToursFor(String(row.id))) connections.push({ title: `Khám phá qua ảnh & bản đồ: ${mapTour.title}`, href: `/hanh-trinh/${mapTour.slug}#chang-${index + 1}` });
    return { id: String(row.stop_id), title: String(row.title), slug: String(row.slug), summary: String(row.summary ?? ''), scope: String(row.scope_note ?? ''), photo: journeyPhoto(row), sections: parseSections(row.sections_json ?? '[]'), chapter: chapter ? { name: chapter.name, href: `/#${chapterAnchor(chapter)}` } : undefined,
      arrival: journeyArrivals[String(row.content_id)], departure: narrative?.bridges[String(row.content_id)],
      allusion: journeyLiterature[journeyArrivalAllusions[String(row.content_id)] ?? (index === 0 ? narrative?.allusion ?? '' : '')],
      sources: [...new Map(citations.map(source => [source.source_id, { id: String(source.source_id), name: String(source.source_name), url: String(source.source_url) }])).values()], connected: connections };
  }));
  return <main id="main" className="journey-reading-page"><div className="journey-reading-crumb"><Breadcrumb items={[{ label: 'Hành trình', href: '/hanh-trinh' }, { label: tour.title }]} /></div><JourneyReader slug={String(tour.slug)} title={String(tour.title)} description={narrative?.opening ?? String(tour.description)} closing={narrative?.closing} epigraph={journeyLiterature[narrative?.epigraph ?? '']} initialStop={initialStop} stops={stops} /></main>;
}
