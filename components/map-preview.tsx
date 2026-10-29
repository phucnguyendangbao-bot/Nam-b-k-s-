import type { HeritagePlace, PlaceTour } from '@/lib/heritage-places';

/**
 * Ảnh xem trước bản đồ, vẽ từ chính tọa độ của các điểm (không phải ảnh chụp bản đồ nền).
 * Chiếu phẳng theo vĩ độ trung bình nên khoảng cách tương đối giữa các điểm là đúng tỉ lệ.
 * Mỗi ghim là liên kết tới điểm đó trên trang bản đồ.
 */
export function MapPreview({ places, tours }: { places: HeritagePlace[]; tours: PlaceTour[] }) {
  if (!places.length) return null;
  const W = 640, H = 440, pad = 56;
  const reviewed = places.filter(p => p.coord === 'reviewed').length;
  const lats = places.map(p => p.lat);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const k = Math.cos((midLat * Math.PI) / 180);
  const xs = places.map(p => p.lng * k), ys = places.map(p => -p.lat);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min((W - pad * 2) / (maxX - minX || 1), (H - pad * 2) / (maxY - minY || 1));
  const ox = (W - (maxX - minX) * scale) / 2, oy = (H - (maxY - minY) * scale) / 2;
  const pt = (lng: number, lat: number) => [ox + (lng * k - minX) * scale, oy + (-lat - minY) * scale] as const;
  const path = (coords: [number, number][]) => coords.map(([lng, lat], i) => { const [x, y] = pt(lng, lat); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('');

  // Nhãn cố định chỉ cho điểm không chen nhãn khác (cách ≥ 90px); điểm sát nhau hiện nhãn khi rê chuột hoặc focus.
  const labeled: [number, number][] = [];
  const showLabel = places.map(p => {
    const [x, y] = pt(p.lng, p.lat);
    if (labeled.some(([a, b]) => Math.hypot(a - x, b - y) < 90)) return false;
    labeled.push([x, y]);
    return true;
  });

  return (
    <figure className="map-preview">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-labelledby="map-preview-title">
        <title id="map-preview-title">{`Vị trí tương đối của ${places.length} điểm di sản quanh sông Cần Thơ và rạch Bình Thủy`}</title>
        <defs>
          <pattern id="mp-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="currentColor" strokeOpacity=".07" /></pattern>
        </defs>
        <rect width={W} height={H} fill="url(#mp-grid)" />
        {tours.map(t => t.legs.map((leg, i) => (
          <path key={`${t.slug}-${i}`} d={path(leg.coords)} className={leg.traced ? 'mp-leg is-river' : 'mp-leg'} />
        )))}
        {places.map((p, i) => {
          const [x, y] = pt(p.lng, p.lat);
          return (
            <a key={p.id} href={`/ban-do?diem=${encodeURIComponent(p.id)}`} className={`mp-pin coord-${p.coord}${showLabel[i] ? ' is-labeled' : ''}`} aria-label={`${p.name}, mở trên bản đồ`}>
              <circle cx={x} cy={y} r="14" className="mp-halo" />
              <circle cx={x} cy={y} r="5.5" className="mp-dot" />
              <text x={x + 12} y={y - 10} className="mp-label">{p.name}</text>
              <title>{`${i + 1}. ${p.name}`}</title>
            </a>
          );
        })}
      </svg>
      <figcaption>Vị trí tương đối theo tọa độ: {reviewed} điểm đã đối chiếu, {places.length - reviewed} điểm lấy từ OpenStreetMap chưa đối chiếu tại chỗ. Nét liền là chặng đi ghe đã dò theo lòng sông, nét đứt là chặng đi bộ.</figcaption>
    </figure>
  );
}
