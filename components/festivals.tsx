import Image from 'next/image';
import { Breadcrumb, PageTitle } from '@/components/site';
import { FestivalActions } from '@/components/interactive/festival-actions';
import { festivalViews, type FestivalView } from '@/lib/festivals';
import { dateStatusLabels, daysUntil, lowerFirst, directionsUrl, formatRange, lunarLabel, timeLabels, todayInVietnam } from '@/lib/festival-format';
import { siteUrl } from '@/lib/site-url';
import { ph } from '@/lib/media';

const anchor = (o: { id: string }) => `le-${o.id.toLowerCase()}`;
const pageUrl = (o: { id: string }) => `${siteUrl}/lich-le-hoi#${anchor(o)}`;
/** Chỉ gửi xuống trình duyệt các trường cần cho tệp lịch. */
const forClient = (o: FestivalView) => ({ id: o.id, name: o.name, edition: o.edition, start: o.start, end: o.end, place_as_written: o.place_as_written, why: o.why, statusNote: o.statusNote });

function When({ o, today }: { o: FestivalView; today: string }) {
  const days = daysUntil(o.start, today);
  const hint = o.time === 'upcoming' ? (days === 1 ? 'ngày mai' : `còn ${days} ngày`) : o.time === 'ongoing' ? 'hôm nay' : null;
  return (
    <p className="fx-when">
      <span className={`fx-time is-${o.time}`}>{timeLabels[o.time]}{hint && <small> · {hint}</small>}</span>
      <time dateTime={o.start}>{formatRange(o.start, o.end)}</time>
      <span className="fx-lunar">{lunarLabel(o.lunar)} âm lịch</span>
    </p>
  );
}

/** Thẻ một kỳ lễ: ảnh, tên, nơi, ngày, nhãn nguồn, một câu vì sao, số nguồn và hành động. */
export function FestivalCard({ o, today = todayInVietnam(), headingLevel = 3 }: { o: FestivalView; today?: string; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className={`fx-card is-${o.time} st-${o.date_status}`} id={anchor(o)} aria-labelledby={`${anchor(o)}-t`}>
      {o.image && (
        <div className="fx-photo ph" style={ph(o.image.src)}>
          <Image src={o.image.src} alt="" fill sizes="(max-width: 640px) 100vw, 240px" quality={75} />
        </div>
      )}
      <div className="fx-body">
        <When o={o} today={today} />
        <H id={`${anchor(o)}-t`} className="fx-title">{o.name} <span>{lowerFirst(o.edition)}</span></H>
        <p className="fx-place">{o.place_as_written}</p>
        <p className="fx-why">{o.why}</p>
        <p className={`fx-status st-${o.date_status}`}>
          <strong>{dateStatusLabels[o.date_status].label}.</strong> {o.statusNote}
        </p>
        <details className="fx-sources">
          <summary>{o.sources.length} nguồn cho ngày này</summary>
          <p className="fx-written">Nguồn ghi: “{o.source_as_written}” <small>({o.locator})</small></p>
          <ul>{o.sources.map(s => <li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a> <small>{s.publisher}</small></li>)}</ul>
        </details>
        <p className="fx-links">
          {o.dossier && <a className="text-link" href={o.dossier.href}>Đọc hồ sơ: {o.dossier.title}</a>}
          {o.related.map(r => <a key={r.href} className="text-link" href={r.href}>{r.title}</a>)}
          {o.place_id && o.place && <a className="text-link" href={`/ban-do?diem=${encodeURIComponent(o.place_id)}&le=${encodeURIComponent(o.id)}`}>Xem trên bản đồ</a>}
        </p>
        <FestivalActions festival={forClient(o)} url={pageUrl(o)} past={o.time === 'past'} directions={o.place ? directionsUrl(o.place) : undefined} />
        {o.image && <p className="fx-credit">Ảnh minh họa địa điểm, không chụp trong kỳ lễ này: {o.image.href ? <a href={o.image.href} target="_blank" rel="noreferrer">{o.image.credit}</a> : o.image.credit}</p>}
      </div>
    </article>
  );
}

const regionFilters = [{ id: '', label: 'Mọi vùng' }, { id: 'tay-nam-bo', label: 'Tây Nam Bộ' }, { id: 'dong-nam-bo', label: 'Đông Nam Bộ' }];
const timeFilters = [{ id: '', label: 'Tất cả' }, { id: 'sap-toi', label: 'Sắp và đang diễn ra' }, { id: 'da-qua', label: 'Đã diễn ra' }];

/** Trang lịch lễ hội: kỳ sắp tới trước, kỳ đã qua sau; lọc bằng liên kết (chạy được khi tắt JavaScript). */
export async function FestivalCalendarPage({ params }: { params: Record<string, string | undefined> }) {
  const today = todayInVietnam();
  const all = await festivalViews(undefined, today);
  const region = regionFilters.some(r => r.id === params.vung) ? params.vung ?? '' : '';
  const when = timeFilters.some(t => t.id === params.khi) ? params.khi ?? '' : '';
  const shown = all.filter(o => (!region || o.region === region) && (!when || (when === 'da-qua') === (o.time === 'past')));
  const coming = shown.filter(o => o.time !== 'past'), past = shown.filter(o => o.time === 'past');
  const link = (next: Record<string, string>) => {
    const q = new URLSearchParams(Object.entries({ vung: region, khi: when, ...next }).filter(([, v]) => v));
    return `/lich-le-hoi${q.size ? `?${q}` : ''}`;
  };
  const next = all.find(o => o.time !== 'past');
  return (
    <main id="main" className="wrap page page-festivals">
      <Breadcrumb items={[{ label: 'Lịch lễ hội' }]} />
      <PageTitle eyebrow="Mùa lễ hội" title="Lịch lễ hội" description="Các kỳ lễ có ngày cụ thể, mỗi ngày kèm nguồn và một nhãn cho biết ngày ấy chắc tới đâu. Hồ sơ lễ thức nằm riêng; ở đây là từng kỳ tổ chức." />
      <dl className="fx-stats">
        <div><dt>Sắp và đang diễn ra</dt><dd>{all.filter(o => o.time !== 'past').length}</dd></div>
        <div><dt>Đã diễn ra, có tường thuật</dt><dd>{all.filter(o => o.time === 'past').length}</dd></div>
        <div><dt>Nguồn cho các ngày</dt><dd>{new Set(all.flatMap(o => o.source_ids)).size}</dd></div>
        {next && <div className="is-next"><dt>Gần nhất</dt><dd><a href={`#${anchor(next)}`}>{next.name}</a><small>{formatRange(next.start, next.end)}</small></dd></div>}
      </dl>
      <nav className="fx-filters" aria-label="Lọc lịch lễ hội">
        <div role="group" aria-label="Theo thời gian">{timeFilters.map(t => <a key={t.id} className="nb-chip" aria-current={t.id === when ? 'true' : undefined} href={link({ khi: t.id })}>{t.label}</a>)}</div>
        <div role="group" aria-label="Theo vùng">{regionFilters.map(r => <a key={r.id} className="nb-chip" aria-current={r.id === region ? 'true' : undefined} href={link({ vung: r.id })}>{r.label}</a>)}</div>
      </nav>
      <details className="fx-legend">
        <summary>Cách đọc nhãn ngày</summary>
        <dl>{Object.entries(dateStatusLabels).map(([k, v]) => <div key={k} className={`st-${k}`}><dt>{v.label}</dt><dd>{v.note}</dd></div>)}</dl>
        <p>Ngày âm lịch ghi kèm được kiểm lại theo lịch âm Việt Nam (múi giờ UTC+7). Gần ngày lễ, hãy đối chiếu thông báo của ban tổ chức: giờ và chương trình có thể đổi.</p>
      </details>
      {coming.length > 0 && (
        <section className="fx-group" aria-labelledby="fx-coming">
          <h2 id="fx-coming">Sắp và đang diễn ra</h2>
          <div className="fx-list">{coming.map(o => <FestivalCard key={o.id} o={o} today={today} />)}</div>
        </section>
      )}
      {past.length > 0 && (
        <section className="fx-group is-past" aria-labelledby="fx-past">
          <h2 id="fx-past">Đã diễn ra</h2>
          <div className="fx-list">{past.map(o => <FestivalCard key={o.id} o={o} today={today} />)}</div>
        </section>
      )}
      {!shown.length && <p className="fx-empty">Không có kỳ lễ nào khớp bộ lọc. <a className="text-link" href="/lich-le-hoi">Xem tất cả</a></p>}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(all.filter(o => o.date_status !== 'traditional').map(o => ({
        '@context': 'https://schema.org', '@type': 'Event', name: `${o.name} (${lowerFirst(o.edition)})`, startDate: o.start, endDate: o.end,
        eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: { '@type': 'Place', name: o.place_as_written, ...(o.place ? { geo: { '@type': 'GeoCoordinates', latitude: o.place.lat, longitude: o.place.lng } } : {}) },
        description: o.why, url: pageUrl(o),
      }))).replace(/</g, '\\u003c') }} />
    </main>
  );
}

/** Khối "Các kỳ tổ chức" trong hồ sơ: chỉ hiện khi hồ sơ có kỳ lễ đã duyệt. */
export async function DossierFestivals({ contentId }: { contentId: string }) {
  const today = todayInVietnam();
  const list = (await festivalViews(undefined, today)).filter(o => o.content_id === contentId || o.related_ids.includes(contentId));
  if (!list.length) return null;
  return (
    <section className="fx-dossier" aria-labelledby="ky-to-chuc">
      <h2 id="ky-to-chuc">Các kỳ tổ chức</h2>
      <ol>
        {list.map(o => (
          <li key={o.id} className={`is-${o.time}`}>
            <When o={o} today={today} />
            <p><strong>{o.name}</strong> · {lowerFirst(o.edition)} · <span className={`fx-status-tag st-${o.date_status}`}>{dateStatusLabels[o.date_status].label}</span></p>
            <FestivalActions festival={forClient(o)} url={pageUrl(o)} past={o.time === 'past'} directions={o.place ? directionsUrl(o.place) : undefined} />
          </li>
        ))}
      </ol>
      <p className="fx-more"><a className="text-link" href="/lich-le-hoi">Xem lịch lễ hội và nguồn của từng ngày</a></p>
    </section>
  );
}
