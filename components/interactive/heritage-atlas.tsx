'use client';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as MLMap, Marker as MLMarker, GeoJSONSource } from 'maplibre-gl';
import { GLOBE_VIEW, MAP_LOCALE, heritageStyle, legFeatures } from '@/lib/map-style';

export type AtlasStop = { id: string; name: string; kicker: string; lat: number; lng: number; dossier?: string };
export type AtlasTour = { slug: string; title: string; kicker: string; draft: boolean; stops: AtlasStop[]; legs: { coords: [number, number][]; traced: boolean }[] };

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 960px)').matches;
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Bản đồ 3D toàn bộ điểm di sản đã có trong tour: chọn một điểm để bay tới, rồi mở chặng tương ứng của tour. */
export function HeritageAtlas({ tours }: { tours: AtlasTour[] }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markers = useRef<{ key: string; marker: MLMarker }[]>([]);
  const pickRef = useRef<(key: string | null) => void>(() => {});
  const [picked, setPicked] = useState<string | null>(null);
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'failed'>('loading');

  const all = tours.flatMap((t, ti) => t.stops.map((s, si) => ({ key: `${t.slug}:${si}`, tour: t, ti, stop: s, si })));
  const current = all.find(x => x.key === picked) ?? null;

  const padding = useCallback(() => (wide() ? { left: 440, right: 60, top: 60, bottom: 60 } : { left: 30, right: 30, top: 40, bottom: 40 }), []);

  const overview = useCallback((duration = 2400) => {
    const map = mapRef.current;
    if (!map) return;
    const pts = tours.flatMap(t => t.stops);
    if (!pts.length) return;
    map.stop();
    map.fitBounds(
      [[Math.min(...pts.map(p => p.lng)), Math.min(...pts.map(p => p.lat))], [Math.max(...pts.map(p => p.lng)), Math.max(...pts.map(p => p.lat))]],
      { padding: padding(), pitch: 50, bearing: -18, maxZoom: 15.5, duration: reduceMotion() ? 0 : duration, essential: true },
    );
  }, [tours, padding]);

  const pick = useCallback((key: string | null) => {
    setPicked(key);
    const map = mapRef.current;
    if (!map) return;
    if (!key) { overview(); return; }
    const [slug, idx] = key.split(':');
    const s = tours.find(t => t.slug === slug)?.stops[Number(idx)];
    if (!s) return;
    map.stop();
    map.flyTo({ center: [s.lng, s.lat], zoom: 17.4, pitch: 62, bearing: -20, padding: padding(), duration: reduceMotion() ? 0 : 3200, curve: 1.3, essential: true });
  }, [tours, overview, padding]);

  useEffect(() => { pickRef.current = pick; }, [pick]);

  useEffect(() => {
    let cancelled = false;
    let map: MLMap | null = null;
    (async () => {
      try {
        const ml = await import('maplibre-gl');
        if (cancelled || !mapEl.current) return;
        map = new ml.Map({
          container: mapEl.current, style: heritageStyle(), center: GLOBE_VIEW.center, zoom: GLOBE_VIEW.zoom,
          maxPitch: 75, attributionControl: false, cooperativeGestures: true, locale: MAP_LOCALE,
        });
        mapRef.current = map;
        map.addControl(new ml.NavigationControl({ visualizePitch: true }), 'top-right');
        map.addControl(new ml.FullscreenControl({ container: mapEl.current.parentElement ?? undefined }), 'top-right');
        map.addControl(new ml.AttributionControl({ compact: true, customAttribution: 'Tọa độ: © OpenStreetMap' }), 'bottom-right');
        map.on('error', () => {});
        tours.forEach((t, ti) => t.stops.forEach((s, si) => {
          const el = document.createElement('button');
          el.type = 'button';
          el.className = `tp-pin tone-${ti % 3}`;
          el.setAttribute('aria-label', `${s.name}, chặng ${si + 1} của tour ${t.title}`);
          el.innerHTML = `<b>${si + 1}</b><span>${escapeHtml(s.name)}</span>`;
          const key = `${t.slug}:${si}`;
          el.addEventListener('click', e => { e.stopPropagation(); pickRef.current(key); });
          markers.current.push({ key, marker: new ml.Marker({ element: el, anchor: 'bottom' }).setLngLat([s.lng, s.lat]).addTo(map!) });
        }));
        map.on('load', () => {
          if (cancelled || !map) return;
          (map.getSource('route') as GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: tours.flatMap(t => legFeatures(t.legs)),
          });
          setMapState('ready');
          if (!wide()) map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
          window.setTimeout(() => overview(5000), 500);
        });
      } catch {
        if (!cancelled) setMapState('failed');
      }
    })();
    return () => { cancelled = true; markers.current = []; map?.remove(); mapRef.current = null; };
  }, [tours, overview]);

  useEffect(() => {
    markers.current.forEach(({ key, marker }) => marker.getElement().classList.toggle('is-active', key === picked));
    const map = mapRef.current;
    if (!map || mapState !== 'ready') return;
    const [slug, idx] = (picked ?? '').split(':');
    const s = tours.find(t => t.slug === slug)?.stops[Number(idx)];
    (map.getSource('focus') as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: s ? [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [s.lng, s.lat] } }] : [],
    });
  }, [picked, mapState, tours]);

  return (
    <div className="tp tp-atlas">
      <div className="tp-stage">
        <div className="tp-map" ref={mapEl} role="application" aria-label="Bản đồ 3D các điểm di sản trong tour. Chọn một điểm trong danh sách để bay tới." />
        {mapState === 'loading' && <div className="tp-map-note" aria-hidden="true">Đang mở địa cầu…</div>}
        {mapState === 'failed' && <div className="tp-map-note is-failed" role="status">Trình duyệt chưa hiển thị được bản đồ 3D (cần WebGL). Danh sách điểm bên cạnh vẫn dẫn tới từng tour.</div>}
        <div className="tp-tools" role="group" aria-label="Chế độ xem">
          <button type="button" onClick={() => pick(null)} aria-pressed={!picked}>Toàn cảnh</button>
        </div>
      </div>
      <section className="tp-panel" aria-label="Các điểm di sản">
        {!current ? (
          <div className="tp-intro">
            <span className="tp-kicker">Bản đồ 3D</span>
            <h2 className="tp-atlas-h">Các điểm di sản trong tour</h2>
            <p className="tp-lede">Chọn một điểm để bay tới, rồi mở chặng tương ứng để nghe thuyết minh có dẫn nguồn.</p>
            {tours.map((t, ti) => (
              <div className="tp-atlas-group" key={t.slug}>
                <p className={`tp-atlas-tour tone-${ti % 3}`}>
                  <a href={`/hanh-trinh/${t.slug}`}>{t.title}</a>
                  {t.draft && <span className="tp-draft">Bản nháp</span>}
                </p>
                <ol className="tp-stoplist">
                  {t.stops.map((s, si) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => pick(`${t.slug}:${si}`)}>
                        <b>{si + 1}</b>
                        <span><strong>{s.name}</strong><em>{s.kicker}</em></span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ) : (
          <article className="tp-stop" key={current.key}>
            <p className="tp-count">{current.tour.title}</p>
            <h2>{current.stop.name}</h2>
            <p className="tp-stop-kicker">{current.stop.kicker}</p>
            <p className="tp-lede">Chặng {current.si + 1} trên {current.tour.stops.length} của tour. Mở tour để nghe thuyết minh, xem nguồn và đi tiếp các chặng.</p>
            <p><a className="tp-link" href={`/hanh-trinh/${current.tour.slug}#chang-${current.si + 1}`}>Mở chặng này trong tour »</a></p>
            {current.stop.dossier && <p><a className="tp-link" href={`/ho-so/${current.stop.dossier}`}>Đọc hồ sơ đầy đủ »</a></p>}
            <p><button type="button" className="tp-back" onClick={() => pick(null)}>‹ Về danh sách điểm</button></p>
          </article>
        )}
      </section>
    </div>
  );
}
