'use client';
import 'leaflet/dist/leaflet.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { HeritagePlace, PlaceTheme, PlaceTour } from '@/lib/heritage-places';
import { placeThemes } from '@/lib/heritage-places';
import { MAP_LOCALE, heritageStyle, legFeatures, smoothLine } from '@/lib/map-style';

type Mode = '2d' | '3d';
type Engine = {
  show: (ids: Set<string>, routes: boolean, tourSlug: string | null) => void;
  focus: (p: HeritagePlace | null, fit: HeritagePlace[]) => void;
  mark: (id: string | null) => void;
  destroy: () => void;
};

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
let webglCache: boolean | undefined;
function hasWebGL() {
  if (webglCache === undefined) {
    try { const c = document.createElement('canvas'); webglCache = Boolean(c.getContext('webgl2') || c.getContext('webgl')); } catch { webglCache = false; }
  }
  return webglCache;
}
const noSubscribe = () => () => {};
const coordLabel = { reviewed: 'Tọa độ đã đối chiếu', osm: 'Tọa độ OpenStreetMap, chưa đối chiếu tại chỗ' } as const;
const pinHtml = (p: HeritagePlace, n: number) => `<span class="ap-pin theme-${p.theme} coord-${p.coord}"><b>${n}</b><span>${escapeHtml(p.name)}</span></span>`;

/** Bản đồ 2D bằng Leaflet: không cần WebGL, dùng làm mặc định và phương án dự phòng. */
async function mount2D(el: HTMLDivElement, places: HeritagePlace[], tours: PlaceTour[], onPick: (id: string) => void): Promise<Engine> {
  const L = (await import('leaflet')).default;
  const map = L.map(el, { zoomControl: false, scrollWheelZoom: false, attributionControl: true, zoomSnap: 0.5 });
  L.control.zoom({ position: 'topright', zoomInTitle: 'Phóng to', zoomOutTitle: 'Thu nhỏ' }).addTo(map);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>' }).addTo(map);
  map.attributionControl.setPrefix(false);
  map.on('focus', () => map.scrollWheelZoom.enable());
  map.on('blur', () => map.scrollWheelZoom.disable());
  const markers = new Map<string, import('leaflet').Marker>();
  places.forEach((p, i) => {
    const icon = L.divIcon({ className: 'ap-icon', html: pinHtml(p, i + 1), iconSize: [30, 30], iconAnchor: [15, 15] });
    const m = L.marker([p.lat, p.lng], { icon, title: p.name, alt: p.name, keyboard: true, riseOnHover: true });
    m.on('click', () => onPick(p.id));
    m.on('keypress', e => { const k = (e as unknown as { originalEvent: KeyboardEvent }).originalEvent.key; if (k === 'Enter' || k === ' ') onPick(p.id); });
    markers.set(p.id, m);
  });
  const lines = tours.map(t => ({
    slug: t.slug,
    layers: t.legs.map(l => L.polyline((l.traced ? smoothLine(l.coords) : l.coords).map(([lng, lat]) => [lat, lng] as [number, number]), {
      color: l.traced ? '#1F5A52' : '#8A5627', weight: l.traced ? 3 : 2, opacity: .85, dashArray: l.traced ? undefined : '4 6', interactive: false,
    })),
  }));
  const fit = (pts: HeritagePlace[]) => {
    if (!pts.length) return;
    if (pts.length === 1) map.setView([pts[0].lat, pts[0].lng], 16, { animate: !reduceMotion() });
    else map.fitBounds(L.latLngBounds(pts.map(p => [p.lat, p.lng] as [number, number])), { padding: [48, 48], maxZoom: 16, animate: !reduceMotion() });
  };
  fit(places);
  return {
    show(ids, routes, tourSlug) {
      markers.forEach((m, id) => { if (ids.has(id)) m.addTo(map); else m.remove(); });
      lines.forEach(t => t.layers.forEach(l => { if (routes && (!tourSlug || tourSlug === t.slug)) l.addTo(map); else l.remove(); }));
    },
    focus(p, pts) { if (p) map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 16.5), { duration: reduceMotion() ? 0 : .8 }); else fit(pts); },
    mark(id) { markers.forEach((m, k) => m.getElement()?.querySelector('.ap-pin')?.classList.toggle('is-active', k === id)); },
    destroy() { map.remove(); },
  };
}

/** Bản đồ 3D bằng MapLibre: địa cầu, ảnh vệ tinh, góc nghiêng. Cần WebGL. */
async function mount3D(el: HTMLDivElement, places: HeritagePlace[], tours: PlaceTour[], onPick: (id: string) => void): Promise<Engine> {
  const ml = await import('maplibre-gl');
  const map = new ml.Map({ container: el, style: heritageStyle(), center: [105.77, 10.04], zoom: 11, pitch: 50, bearing: -18, maxPitch: 75, attributionControl: false, cooperativeGestures: true, locale: MAP_LOCALE });
  map.addControl(new ml.NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new ml.AttributionControl({ compact: true, customAttribution: 'Tọa độ: © OpenStreetMap' }), 'bottom-right');
  map.on('error', () => {});
  await new Promise<void>(resolve => { map.once('load', () => resolve()); window.setTimeout(resolve, 8000); });
  const markers = new Map<string, import('maplibre-gl').Marker>();
  places.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ap-icon';
    btn.setAttribute('aria-label', `${p.name}. ${coordLabel[p.coord]}`);
    btn.innerHTML = pinHtml(p, i + 1);
    btn.addEventListener('click', e => { e.stopPropagation(); onPick(p.id); });
    markers.set(p.id, new ml.Marker({ element: btn, anchor: 'center' }).setLngLat([p.lng, p.lat]));
  });
  const setRoutes = (on: boolean, tourSlug: string | null) => {
    const src = map.getSource('route') as import('maplibre-gl').GeoJSONSource | undefined;
    src?.setData({ type: 'FeatureCollection', features: on ? tours.filter(t => !tourSlug || t.slug === tourSlug).flatMap(t => legFeatures(t.legs)) : [] });
  };
  const fit = (pts: HeritagePlace[]) => {
    if (!pts.length) return;
    map.fitBounds([[Math.min(...pts.map(p => p.lng)), Math.min(...pts.map(p => p.lat))], [Math.max(...pts.map(p => p.lng)), Math.max(...pts.map(p => p.lat))]],
      { padding: 70, pitch: 50, bearing: -18, maxZoom: 16, duration: reduceMotion() ? 0 : 2200 });
  };
  fit(places);
  return {
    show(ids, routes, tourSlug) { markers.forEach((m, id) => { if (ids.has(id)) m.addTo(map); else m.remove(); }); setRoutes(routes, tourSlug); },
    focus(p, pts) {
      const focus = map.getSource('focus') as import('maplibre-gl').GeoJSONSource | undefined;
      focus?.setData({ type: 'FeatureCollection', features: p ? [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [p.lng, p.lat] } }] : [] });
      if (p) map.flyTo({ center: [p.lng, p.lat], zoom: 17.2, pitch: 62, bearing: -20, duration: reduceMotion() ? 0 : 2600, essential: true });
      else fit(pts);
    },
    mark(id) { markers.forEach((m, k) => m.getElement().querySelector('.ap-pin')?.classList.toggle('is-active', k === id)); },
    destroy() { map.remove(); },
  };
}

/** Bản đồ di sản: 2D thuận tiện làm mặc định, 3D vệ tinh là lựa chọn nâng cao; lọc theo nhóm địa điểm và tuyến. */
export function HeritageAtlas({ places, tours, initialId, compact = false }: { places: HeritagePlace[]; tours: PlaceTour[]; initialId?: string; compact?: boolean }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine | null>(null);
  const [mode, setMode] = useState<Mode>('2d');
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const webgl = useSyncExternalStore(noSubscribe, hasWebGL, () => null);
  const [notice, setNotice] = useState('');
  const [theme, setTheme] = useState<PlaceTheme | 'all'>('all');
  const [tour, setTour] = useState<string | null>(null);
  const [routes, setRoutes] = useState(true);
  const [picked, setPicked] = useState<string | null>(places.some(p => p.id === initialId) ? initialId! : null);

  const visible = useMemo(() => places.filter(p => (theme === 'all' || p.theme === theme) && (!tour || p.tours.some(t => t.slug === tour))), [places, theme, tour]);
  const current = places.find(p => p.id === picked) ?? null;
  const themesPresent = (Object.keys(placeThemes) as PlaceTheme[]).filter(t => places.some(p => p.theme === t));
  const reviewedCount = places.filter(p => p.coord === 'reviewed').length;

  const pick = useCallback((id: string | null) => {
    setPicked(id);
    try {
      const url = new URL(window.location.href);
      if (id) url.searchParams.set('diem', id); else url.searchParams.delete('diem');
      window.history.replaceState(null, '', url);
    } catch { /* trình duyệt chặn đổi URL: bỏ qua */ }
  }, []);

  // Dựng lại bản đồ khi đổi chế độ 2D/3D.
  useEffect(() => {
    let cancelled = false;
    const el = mapEl.current;
    if (!el) return;
    (async () => {
      try {
        const mounted = await (mode === '3d' ? mount3D : mount2D)(el, places, tours, id => pick(id));
        if (cancelled) { mounted.destroy(); return; }
        engine.current = mounted;
        setState('ready');
      } catch {
        if (cancelled) return;
        el.innerHTML = '';
        if (mode === '3d') { setNotice('Chưa mở được bản đồ 3D trên thiết bị này, đã chuyển về bản đồ 2D.'); setState('loading'); setMode('2d'); }
        else setState('failed');
      }
    })();
    return () => { cancelled = true; engine.current?.destroy(); engine.current = null; el.innerHTML = ''; el.className = 'atlas-map'; };
  }, [mode, places, tours, pick]);

  useEffect(() => {
    if (state !== 'ready') return;
    engine.current?.show(new Set(visible.map(p => p.id)), routes, tour);
  }, [state, visible, routes, tour]);

  useEffect(() => {
    if (state !== 'ready') return;
    engine.current?.mark(picked);
    engine.current?.focus(current, visible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, picked]);

  useEffect(() => {
    if (state !== 'ready' || picked) return;
    engine.current?.focus(null, visible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, tour]);

  const switchMode = (next: Mode) => { if (next === mode) return; setNotice(''); setState('loading'); setMode(next); };
  const count = (t: PlaceTheme | 'all') => places.filter(p => (t === 'all' || p.theme === t) && (!tour || p.tours.some(x => x.slug === tour))).length;

  return (
    <div className={`atlas ${compact ? 'is-compact' : ''}`} data-mode={mode}>
      <div className="atlas-bar">
        <div className="atlas-filters" role="group" aria-label="Lọc theo nhóm địa điểm">
          <button type="button" className="nb-chip" aria-pressed={theme === 'all'} onClick={() => setTheme('all')}>Tất cả <small>{count('all')}</small></button>
          {themesPresent.map(t => <button key={t} type="button" className="nb-chip" aria-pressed={theme === t} onClick={() => setTheme(t)}>{placeThemes[t]} <small>{count(t)}</small></button>)}
        </div>
        <div className="atlas-modes">
          {!compact && tours.length > 1 && (
            <label className="atlas-select">
              <span className="sr-only">Lọc theo tuyến</span>
              <select value={tour ?? ''} onChange={e => setTour(e.target.value || null)}>
                <option value="">Mọi tuyến tour</option>
                {tours.map(t => <option key={t.slug} value={t.slug}>{t.title}</option>)}
              </select>
            </label>
          )}
          <div className="nb-segment" role="group" aria-label="Kiểu bản đồ">
            <button type="button" aria-pressed={mode === '2d'} onClick={() => switchMode('2d')}>2D</button>
            <button type="button" aria-pressed={mode === '3d'} disabled={webgl === false} title={webgl === false ? 'Thiết bị chưa hỗ trợ WebGL nên chưa xem được 3D' : 'Ảnh vệ tinh, góc nhìn nghiêng'} onClick={() => switchMode('3d')}>3D vệ tinh</button>
          </div>
        </div>
      </div>
      {(notice || webgl === false) && <p className="atlas-notice" role="status">{notice || 'Thiết bị này chưa hỗ trợ WebGL nên chỉ hiện bản đồ 2D. Mọi thông tin địa điểm vẫn đầy đủ.'}</p>}

      <div className="atlas-body">
        <div className="atlas-stage">
          <div className="atlas-map" ref={mapEl} role="region" aria-label={`Bản đồ ${mode === '3d' ? '3D vệ tinh' : '2D'} các điểm di sản. Dùng danh sách bên cạnh để chọn bằng bàn phím.`} />
          {state === 'loading' && <div className="atlas-note" aria-hidden="true"><span className="nb-loading"><span /><span /><span /><b>Đang tải bản đồ…</b></span></div>}
          {state === 'failed' && <div className="atlas-note is-failed" role="status"><p>Chưa tải được bản đồ. Kiểm tra kết nối mạng rồi tải lại trang. Danh sách địa điểm bên cạnh vẫn dùng được.</p></div>}
          <div className="atlas-legend">
            <span><i className="ap-key coord-osm" />Tọa độ OSM, chờ đối chiếu</span>
            <span><i className="ap-key coord-reviewed" />Đã đối chiếu{reviewedCount ? ` (${reviewedCount})` : ' (chưa có)'}</span>
            <label className="atlas-routes"><input type="checkbox" checked={routes} onChange={e => setRoutes(e.target.checked)} />Thứ tự chặng</label>
          </div>
        </div>

        <aside className="atlas-panel" aria-label="Thông tin địa điểm">
          {!current ? (
            <>
              <p className="atlas-count" role="status">{visible.length} địa điểm{theme !== 'all' ? `, nhóm ${placeThemes[theme as PlaceTheme].toLowerCase()}` : ''}</p>
              <ol className="atlas-list">
                {visible.map(p => (
                  <li key={p.id}>
                    <button type="button" onClick={() => pick(p.id)}>
                      <b className={`ap-num theme-${p.theme} coord-${p.coord}`}>{places.indexOf(p) + 1}</b>
                      <span><strong>{p.name}</strong><small>{p.kicker}</small></span>
                    </button>
                  </li>
                ))}
              </ol>
              {!visible.length && <div className="atlas-empty"><p>Không có địa điểm nào trong nhóm này.</p><button type="button" className="nb-text-button" onClick={() => { setTheme('all'); setTour(null); }}>Bỏ bộ lọc</button></div>}
            </>
          ) : (
            <article className="atlas-card" key={current.id}>
              <button type="button" className="atlas-back" onClick={() => pick(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
                Danh sách địa điểm
              </button>
              {current.image && (
                <figure className="atlas-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={current.image.src} alt={current.name} loading="lazy" width={480} height={320} />
                  <figcaption>Ảnh: {current.image.href ? <a href={current.image.href} target="_blank" rel="noreferrer">{current.image.credit}</a> : current.image.credit}</figcaption>
                </figure>
              )}
              <p className="atlas-theme">{placeThemes[current.theme]}</p>
              <h3>{current.name}</h3>
              <p className="atlas-kicker">{current.kicker}</p>
              <p className={`atlas-coord coord-${current.coord}`}>
                <strong>{coordLabel[current.coord]}</strong>
                <span>{current.lat.toFixed(5)}, {current.lng.toFixed(5)}</span>
                {current.coord === 'osm' && <span>Vị trí ghim có thể lệch vài chục mét so với thực địa.</span>}
              </p>
              <div className="atlas-actions">
                {current.dossier && <a className="button" href={`/ho-so/${current.dossier.slug}`}>Đọc hồ sơ</a>}
                {current.tours.map(t => (
                  <a key={t.slug} className="button outline" href={`/hanh-trinh/${t.slug}#chang-${t.index + 1}`}>Chặng {t.index + 1}/{t.total} trong tour</a>
                ))}
              </div>
              {current.tours.map(t => <p key={t.slug} className="atlas-tour">{t.title}{t.draft && <span className="badge-draft">Bản nháp, chờ duyệt nguồn</span>}</p>)}
            </article>
          )}
        </aside>
      </div>
      <p className="atlas-foot">Đường nối giữa các điểm chỉ thể hiện thứ tự chặng, không phải lộ trình đã kiểm chứng. Chặng đi ghe được dò theo lòng sông từ ảnh vệ tinh. Khung bản đồ không thể hiện ranh giới hành chính.</p>
    </div>
  );
}
