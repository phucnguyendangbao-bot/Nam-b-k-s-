'use client';
import { useEffect, useRef, useState } from 'react';

export type MapPoint = { id: string; slug: string; title: string; summary: string; area: string; lat: number; lng: number; tone: 'river' | 'dusk' | 'lily' };

/** Khung nhìn mặc định quanh Cần Thơ. Chỉ là vị trí camera, không biểu thị ranh giới hành chính. */
const DEFAULT_VIEW: [number, number] = [10.03, 105.77];

export function MapView({ points, initialId }: { points: MapPoint[]; initialId?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | undefined>(initialId ?? points[0]?.id);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markers = useRef(new Map<string, import('leaflet').Marker>());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const pins = markers.current;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !el.current || mapRef.current) return;
      const map = L.map(el.current, { zoomControl: false, scrollWheelZoom: false, attributionControl: true }).setView(DEFAULT_VIEW, 11);
      L.control.zoom({ position: 'bottomright', zoomInTitle: 'Phóng to', zoomOutTitle: 'Thu nhỏ' }).addTo(map);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
      }).addTo(map);
      map.attributionControl.setPrefix(false);
      for (const p of points) {
        const icon = L.divIcon({ className: '', html: `<span class="nb-pin tone-${p.tone}"><span></span></span>`, iconSize: [36, 44], iconAnchor: [18, 42] });
        const m = L.marker([p.lat, p.lng], { icon, title: p.title, keyboard: true }).addTo(map);
        m.on('click', () => setActiveId(p.id));
        pins.set(p.id, m);
      }
      if (points.length > 1) map.fitBounds(L.latLngBounds(points.map(p => [p.lat, p.lng])), { padding: [60, 60], maxZoom: 15 });
      else if (points.length === 1) map.setView([points[0].lat, points[0].lng], 15);
      mapRef.current = map;
      setReady(true);
    })();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; pins.clear(); setReady(false); };
  }, [points]);

  useEffect(() => {
    const p = points.find(x => x.id === activeId);
    const map = mapRef.current;
    if (!p || !map) return;
    map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 14), { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.8 });
    markers.current.forEach((m, id) => m.getElement()?.querySelector('.nb-pin')?.classList.toggle('is-active', id === activeId));
  }, [activeId, points, ready]);

  const active = points.find(p => p.id === activeId);
  return (
    <div className="nb-map">
      <div className="nb-map-canvas" ref={el} role="region" aria-label="Bản đồ các địa điểm đã đối chiếu" />
      <aside className="nb-map-panel">
        {points.length ? (
          <>
            <p className="nb-map-count">{points.length} địa điểm đã đối chiếu tọa độ</p>
            <ul className="nb-map-list">
              {points.map(p => (
                <li key={p.id}>
                  <button type="button" className={`tone-${p.tone} ${p.id === activeId ? 'is-active' : ''}`} onClick={() => setActiveId(p.id)} aria-pressed={p.id === activeId}>
                    <strong>{p.title}</strong><small>{p.area}</small>
                  </button>
                </li>
              ))}
            </ul>
            {active && (
              <div className={`nb-map-card tone-${active.tone}`}>
                <h2>{active.title}</h2>
                <p>{active.summary}</p>
                <a className="button" href={`/ho-so/${active.slug}`}>Đọc hồ sơ</a>
              </div>
            )}
          </>
        ) : (
          <div className="nb-map-empty">
            <h2>Chưa có điểm nào được ghim.</h2>
            <p>Một địa điểm chỉ lên bản đồ khi ban biên tập đã đối chiếu tọa độ với nguồn. Trong lúc chờ, bạn có thể đọc về những nơi đã có hồ sơ.</p>
            <div className="nb-map-empty-links">
              <a href="/chuyen-muc/dat-nam-bo">Xem chuyên mục Đất Nam Bộ</a>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
