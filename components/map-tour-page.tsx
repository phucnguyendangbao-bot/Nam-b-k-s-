import { Breadcrumb } from '@/components/site';
import { TourPlayer, type Leg } from '@/components/interactive/tour-player';
import { distance, formatDistance, legLabel, mapSources, mapTours, tourLength, type MapSource, type MapTour } from '@/lib/map-tours';
import type { Row } from '@/lib/static-data';

/** Nguồn theo thứ tự xuất hiện đầu tiên trong tour, để số chú thích liền mạch 1, 2, 3… */
export function tourSources(tour: MapTour) {
  const ordered: Record<string, MapSource> = {};
  for (const stop of tour.stops) for (const line of stop.lines) for (const id of line.src) if (mapSources[id] && !ordered[id]) ordered[id] = mapSources[id];
  ordered['S-OSM'] = mapSources['S-OSM'];
  return ordered;
}

export function MapTourCards({ tours = mapTours }: { tours?: MapTour[] }) {
  const published = tours.filter(tour => tour.review === 'reviewed' || tour.publicDraft);
  if (!published.length) return <div className="notice"><p>Tour bản đồ đang được đối chiếu nguồn và tọa độ. Trong lúc chờ, bạn có thể đọc các hồ sơ đã kiểm chứng theo từng chủ đề.</p><a className="text-link" href="/hanh-trinh?loai=digital">Khám phá các hành trình đọc</a></div>;
  return (
    <div className="tp-cards">
      {published.map(t => (
        <a className="tp-card" href={`/hanh-trinh/${t.slug}`} key={t.id}>
          {t.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.cover.src} alt="" loading="lazy" />
          )}
          <span className="tp-card-body">
            <span className="tp-card-kicker">{t.kicker}</span>
            {t.review === 'draft' && <span className="tp-card-draft">Bản nháp · chờ duyệt nguồn</span>}
            <strong>{t.title}</strong>
            <span className="tp-card-sum">{t.summary}</span>
            <span className="tp-card-meta">
              {t.stops.length} chặng · {formatDistance(tourLength(t))} · {t.stops.map(s => s.name).join(' → ')}
            </span>
            <span className="tp-card-go">Mở tour 3D <span aria-hidden="true">»</span></span>
          </span>
          {t.cover && <small className="tp-card-credit">{t.cover.credit}</small>}
        </a>
      ))}
    </div>
  );
}

export function MapTourPage({ tour, readingTours }: { tour: MapTour; readingTours: Row[] }) {
  const sources = tourSources(tour);
  const legs: Leg[] = tour.stops.slice(0, -1).map((s, i) => ({
    mode: s.next?.mode ?? 'walk',
    label: legLabel[s.next?.mode ?? 'walk'],
    note: s.next?.note ?? '',
    distance: formatDistance(distance(s, tour.stops[i + 1])),
  }));
  const reading = (tour.readingTours ?? [])
    .map(slug => readingTours.find(r => r.slug === slug))
    .filter((r): r is Row => Boolean(r))
    .map(r => ({ slug: String(r.slug), title: String(r.title) }));
  const others = mapTours.filter(t => t.id !== tour.id).map(t => ({ slug: t.slug, title: t.title }));
  return (
    <main id="main" className="tp-page">
      <div className="tp-crumb"><Breadcrumb items={[{ label: 'Hành trình', href: '/hanh-trinh' }, { label: tour.title }]} /></div>
      <TourPlayer tour={tour} sources={sources} legs={legs} length={formatDistance(tourLength(tour))} others={others} reading={reading} />

      <section className="tp-about">
        <div className="tp-about-grid">
          <div>
            <p className="tp-about-kicker">Cách đọc tour này</p>
            <h2>Thuyết minh có nguồn, bản đồ để định hướng</h2>
            <p>Mỗi câu thuyết minh gắn với số nguồn ở cuối câu. Tuyến đang ở dạng bản nháp: dữ kiện đã được dẫn nguồn nhưng chưa qua bước duyệt cuối của ban biên tập, nên có thể còn thay đổi.</p>
            <p>Tọa độ điểm dừng lấy từ OpenStreetMap và chưa được đối chiếu tại chỗ. Nét nối giữa các chặng chỉ để định hướng, không phải lộ trình. Tour không cung cấp giờ mở cửa, giá vé hay quy định tham quan; hãy kiểm tra với nơi bạn đến trước khi đi.</p>
            <p>Giọng đọc là giọng máy có sẵn trong trình duyệt của bạn, chất lượng tùy thiết bị. Ảnh vệ tinh có thể đã cũ hơn hiện trạng.</p>
          </div>
          <div>
            <p className="tp-about-kicker">Các chặng</p>
            <ol className="tp-about-stops">
              {tour.stops.map((s, i) => (
                <li key={s.id}>
                  <a href={`#chang-${i + 1}`}><b>{i + 1}</b> {s.name}</a>
                  <span>{s.kicker}</span>
                  {s.dossier && <a className="tp-about-dossier" href={`/ho-so/${s.dossier.slug}`}>Hồ sơ</a>}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <h2 className="tp-about-h">Nguồn</h2>
        <ol className="tp-about-sources">
          {Object.values(sources).map(src => (
            <li key={src.id} id={`nguon-${src.id}`}>
              <a href={src.url} target="_blank" rel="noreferrer">{src.title}</a>
              <span>{src.publisher}{src.date ? `, ${src.date}` : ''}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
