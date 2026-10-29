import { categories } from './catalog';
import { legCoords, mapTours, type MapTour } from './map-tours';
import type { Row } from './static-data';

/**
 * Điểm di sản trên bản đồ: gom điểm dừng của tour bản đồ và hồ sơ đã đối chiếu tọa độ.
 *
 * Trạng thái tọa độ luôn đi kèm từng điểm:
 * - `reviewed`: ban biên tập đã đối chiếu tọa độ với nguồn (trường `geo_reviewed` của hồ sơ).
 * - `osm`: tọa độ lấy từ OpenStreetMap, chưa đối chiếu tại chỗ.
 * Nhóm địa điểm dưới đây là cách sắp xếp của trang để lọc, không phải phân loại di tích chính thức.
 */
export type CoordStatus = 'reviewed' | 'osm';
export type PlaceTheme = 'worship' | 'river' | 'house' | 'other';
export const placeThemes: Record<PlaceTheme, string> = {
  worship: 'Đình, chùa, hội quán',
  river: 'Bến sông và chợ',
  house: 'Nhà cổ',
  other: 'Địa điểm khác',
};
const stopTheme: Record<string, PlaceTheme> = {
  'munir-ansay': 'worship', 'chua-ong': 'worship', 'dinh-binh-thuy': 'worship', 'chua-nam-nha': 'worship',
  'ben-ninh-kieu': 'river', 'cho-co': 'river', 'cho-noi-cai-rang': 'river',
  'nha-co-binh-thuy': 'house',
};

export type HeritagePlace = {
  id: string;
  name: string;
  kicker: string;
  lat: number;
  lng: number;
  theme: PlaceTheme;
  coord: CoordStatus;
  image?: { src: string; credit: string; href?: string };
  dossier?: { slug: string; title: string };
  tours: { slug: string; title: string; index: number; total: number; draft: boolean }[];
};
export type PlaceTour = { slug: string; title: string; draft: boolean; stopIds: string[]; legs: { coords: [number, number][]; traced: boolean }[] };

export function heritagePlaces(dossiers: Row[] = []): { places: HeritagePlace[]; tours: PlaceTour[] } {
  const bySlug = new Map(dossiers.map(d => [String(d.slug), d]));
  const places = new Map<string, HeritagePlace>();
  for (const t of mapTours) {
    t.stops.forEach((s, index) => {
      const existing = places.get(s.id);
      const tourRef = { slug: t.slug, title: t.title, index, total: t.stops.length, draft: t.review === 'draft' };
      if (existing) { existing.tours.push(tourRef); return; }
      const dossier = s.dossier ? bySlug.get(s.dossier.slug) : undefined;
      const reviewed = dossier && dossier.geo_reviewed === 1 && dossier.latitude !== null;
      places.set(s.id, {
        id: s.id, name: s.name, kicker: s.kicker,
        lat: reviewed ? Number(dossier.latitude) : s.lat, lng: reviewed ? Number(dossier.longitude) : s.lng,
        theme: stopTheme[s.id] ?? 'other', coord: reviewed ? 'reviewed' : 'osm', image: s.image,
        dossier: s.dossier ? { slug: s.dossier.slug, title: String(dossier?.title ?? s.name) } : undefined,
        tours: [tourRef],
      });
    });
  }
  // Hồ sơ có tọa độ đã đối chiếu nhưng chưa nằm trong tour nào.
  for (const d of dossiers) {
    if (d.geo_reviewed !== 1 || d.latitude === null || d.longitude === null) continue;
    if ([...places.values()].some(p => p.dossier?.slug === d.slug)) continue;
    const cat = categories.find(c => (c.types as readonly string[]).includes(d.category));
    places.set(`ho-so-${d.id}`, {
      id: `ho-so-${d.id}`, name: String(d.title), kicker: cat?.name ?? String(d.historical_area ?? ''),
      lat: Number(d.latitude), lng: Number(d.longitude), theme: d.topic === 'architecture' ? 'house' : 'other', coord: 'reviewed',
      image: d.image_url ? { src: String(d.image_url), credit: `${d.image_author}, ${d.image_license}` } : undefined,
      dossier: { slug: String(d.slug), title: String(d.title) }, tours: [],
    });
  }
  const tours: PlaceTour[] = mapTours.map((t: MapTour) => ({
    slug: t.slug, title: t.title, draft: t.review === 'draft', stopIds: t.stops.map(s => s.id),
    legs: t.stops.slice(0, -1).map((s, k) => ({ coords: legCoords(t, k), traced: Boolean(s.next?.path) })),
  }));
  return { places: [...places.values()], tours };
}
