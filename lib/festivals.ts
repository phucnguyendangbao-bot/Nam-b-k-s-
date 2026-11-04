import { reviewedRelease } from './reviewed-release';
import { publicContents, type Row } from './static-data';
import { heritagePlaces, type HeritagePlace } from './heritage-places';
import type { FestivalOccurrence } from './release-model';
import { dateStatusLabels, timeStatus, todayInVietnam, type TimeStatus } from './festival-format';
import { knowledgeRegions } from './knowledge-taxonomy';

export type FestivalView = FestivalOccurrence & {
  time: TimeStatus;
  dossier: { slug: string; title: string; href: string } | null;
  related: { title: string; href: string }[];
  image: { src: string; alt: string; credit: string; href: string } | null;
  sources: { id: string; name: string; url: string; publisher: string }[];
  place: { lat: number; lng: number; coord: HeritagePlace['coord']; name: string } | null;
  regionName: string;
  statusNote: string;
};

/** Mọi kỳ lễ đã duyệt, gắn hồ sơ, ảnh, nguồn và tọa độ điểm (nếu có). Chỉ giữ kỳ lễ có hồ sơ đã công bố. */
export async function festivalViews(rows?: Row[], today = todayInVietnam()): Promise<FestivalView[]> {
  const dossiers = rows ?? await publicContents();
  const byId = new Map(dossiers.map(row => [String(row.id), row]));
  const { places } = heritagePlaces(dossiers);
  const placeById = new Map(places.map(p => [p.id, p]));
  const sources = new Map(reviewedRelease.sources.map(s => [s.id, s]));
  const list: FestivalView[] = [];
  for (const o of reviewedRelease.occurrences ?? []) {
    const d = byId.get(o.content_id);
    if (!d) continue;
    const p = o.place_id ? placeById.get(o.place_id) : undefined;
    list.push({
      ...o, time: timeStatus(o, today),
      dossier: { slug: String(d.slug), title: String(d.title), href: `/ho-so/${d.slug}` },
      related: o.related_ids.map(id => byId.get(id)).filter((r): r is Row => Boolean(r)).map(r => ({ title: String(r.title), href: `/ho-so/${r.slug}` })),
      image: d.image_url ? { src: String(d.image_url), alt: String(d.title), credit: `${d.image_author}, ${d.image_license}`, href: String(d.image_source_url ?? '') } : null,
      sources: o.source_ids.map(id => sources.get(id)).filter(s => s !== undefined).map(s => ({ id: s.id, name: s.name, url: s.url, publisher: s.publisher })),
      place: p ? { lat: p.lat, lng: p.lng, coord: p.coord, name: p.name } : null,
      regionName: knowledgeRegions.find(r => r.id === o.region)?.name ?? o.region,
      statusNote: o.estimate_note ?? o.note ?? dateStatusLabels[o.date_status].note,
    });
  }
  // Sắp/đang diễn ra trước (gần nhất trước), rồi các kỳ đã qua (mới nhất trước).
  return list.sort((a, b) => (a.time === 'past') !== (b.time === 'past') ? (a.time === 'past' ? 1 : -1)
    : a.time === 'past' ? b.start.localeCompare(a.start) : a.start.localeCompare(b.start));
}
