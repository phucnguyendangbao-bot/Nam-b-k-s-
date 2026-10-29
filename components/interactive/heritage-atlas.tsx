'use client';
import 'leaflet/dist/leaflet.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { HeritagePlace, PlaceTheme, PlaceTour } from '@/lib/heritage-places';
import { placeThemes } from '@/lib/heritage-places';
import { fold } from '@/lib/catalog';
import { MAP_LOCALE, heritageStyle, legFeatures, markHeritageBuildings, smoothLine, type MapLook } from '@/lib/map-style';
import { googleLinks, hasGoogleMaps, loadGoogleMaps, onGoogleAuthFailure, type Map3D } from '@/lib/google-maps';
import { StreetViewPanel } from './street-view';
import { hasCesium, loadCesium } from '@/lib/cesium';

type Mode = '2d' | MapLook | 'google';
const modeLabel: Record<Mode, string> = { '2d': '2D', street: '3D phố', satellite: '3D vệ tinh', google: '3D Google' };
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

/** Bản đồ 3D bằng MapLibre, cần WebGL. `street`: đường, tên đường, khối nhà 3D; `satellite`: ảnh vệ tinh kèm nhãn. */
async function mount3D(el: HTMLDivElement, places: HeritagePlace[], tours: PlaceTour[], onPick: (id: string) => void, look: MapLook = 'street'): Promise<Engine> {
  const ml = await import('maplibre-gl');
  const map = new ml.Map({ container: el, style: heritageStyle(look), center: [105.77, 10.04], zoom: 11, pitch: 55, bearing: -18, maxPitch: 78, attributionControl: false, cooperativeGestures: true, locale: MAP_LOCALE });
  // Khối nhà nằm ngay dưới điểm di sản được tô vàng khi bản đồ đứng yên.
  map.on('idle', () => markHeritageBuildings(map, places));
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
      { padding: 70, pitch: 55, bearing: -18, maxZoom: 16.4, duration: reduceMotion() ? 0 : 2200 });
  };
  fit(places);
  return {
    show(ids, routes, tourSlug) { markers.forEach((m, id) => { if (ids.has(id)) m.addTo(map); else m.remove(); }); setRoutes(routes, tourSlug); },
    focus(p, pts) {
      const focus = map.getSource('focus') as import('maplibre-gl').GeoJSONSource | undefined;
      focus?.setData({ type: 'FeatureCollection', features: p ? [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [p.lng, p.lat] } }] : [] });
      if (p) map.flyTo({ center: [p.lng, p.lat], zoom: look === 'street' ? 17.6 : 17.2, pitch: look === 'street' ? 64 : 62, bearing: -20, duration: reduceMotion() ? 0 : 2600, essential: true });
      else fit(pts);
    },
    mark(id) { markers.forEach((m, k) => m.getElement().querySelector('.ap-pin')?.classList.toggle('is-active', k === id)); },
    destroy() { map.remove(); },
  };
}

/**
 * Bản đồ 3D chân thực của Google (Maps JavaScript API, Map3DElement): nhà cửa dựng từ ảnh chụp ở nơi Google có dữ liệu,
 * nơi khác là ảnh vệ tinh phủ lên địa hình. Ghim là marker 3D có cột, tuyến là đường 3D bám mặt đất.
 */
async function mountGoogle3D(el: HTMLDivElement, places: HeritagePlace[], tours: PlaceTour[], onPick: (id: string) => void): Promise<Engine> {
  const g = await loadGoogleMaps();
  const lib = await g.maps.importLibrary('maps3d');
  const center = (pts: HeritagePlace[]) => {
    const lats = pts.map(p => p.lat), lngs = pts.map(p => p.lng);
    const c = { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 };
    const span = Math.max(...pts.map(p => Math.hypot((p.lat - c.lat) * 111000, (p.lng - c.lng) * 109000)));
    return { c, range: Math.max(900, span * 3.2) };
  };
  const start = center(places);
  const map = new lib.Map3DElement({
    center: { ...start.c, altitude: 0 }, range: start.range, tilt: 58, heading: -20,
    mode: lib.MapMode.HYBRID, ...(lib.GestureHandling ? { gestureHandling: lib.GestureHandling.COOPERATIVE } : {}),
  });
  map.className = 'gm3d';
  el.appendChild(map);
  const markers = new Map<string, HTMLElement>();
  places.forEach((p, i) => {
    const m = new lib.Marker3DInteractiveElement({
      position: { lat: p.lat, lng: p.lng, altitude: 40 }, altitudeMode: lib.AltitudeMode.RELATIVE_TO_GROUND, extruded: true,
      label: `${i + 1}. ${p.name}`, title: p.name,
    });
    m.addEventListener('gmp-click', () => onPick(p.id));
    markers.set(p.id, m);
  });
  const lines = tours.map(t => ({
    slug: t.slug,
    els: t.legs.map(l => new lib.Polyline3DElement({
      path: (l.traced ? smoothLine(l.coords) : l.coords).map(([lng, lat]) => ({ lat, lng })),
      strokeColor: l.traced ? '#F3E7CD' : '#D9BC86', strokeWidth: l.traced ? 6 : 4, outerColor: '#244B43', outerWidth: 0.35,
      altitudeMode: lib.AltitudeMode.CLAMP_TO_GROUND, drawsOccludedSegments: true,
    })),
  }));
  const fly = (endCamera: Parameters<Map3D['flyCameraTo']>[0]['endCamera']) => map.flyCameraTo({ endCamera, durationMillis: reduceMotion() ? 0 : 2600 });
  const fit = (pts: HeritagePlace[]) => { if (pts.length) { const v = center(pts); fly({ center: { ...v.c, altitude: 0 }, range: v.range, tilt: 58, heading: -20 }); } };
  return {
    show(ids, routes, tourSlug) {
      markers.forEach((m, id) => { if (ids.has(id)) { if (!m.isConnected) map.appendChild(m); } else m.remove(); });
      lines.forEach(t => t.els.forEach(l => { if (routes && (!tourSlug || tourSlug === t.slug)) { if (!l.isConnected) map.appendChild(l); } else l.remove(); }));
    },
    focus(p, pts) { if (p) fly({ center: { lat: p.lat, lng: p.lng, altitude: 0 }, range: 380, tilt: 67, heading: -25 }); else fit(pts); },
    mark() { /* marker 3D của Google không đổi kiểu được bằng CSS; vị trí camera đã cho biết điểm đang chọn */ },
    destroy() { map.stopCameraAnimation?.(); map.remove(); },
  };
}

/**
 * Thành phố 3D chân thực của Google phát qua Cesium ion (không cần tài khoản thanh toán Google).
 * Ghim là điểm có nhãn nổi trên mái nhà; tuyến tour vẽ bám lên bề mặt 3D.
 */
async function mountCesium3D(el: HTMLDivElement, places: HeritagePlace[], tours: PlaceTour[], onPick: (id: string) => void): Promise<Engine> {
  const C = await loadCesium();
  const host = document.createElement('div');
  host.className = 'cesium-host';
  el.appendChild(host);
  const viewer = new C.Viewer(host, {
    timeline: false, animation: false, baseLayerPicker: false, geocoder: false, homeButton: false, sceneModePicker: false,
    navigationHelpButton: false, fullscreenButton: false, infoBox: false, selectionIndicator: false, globe: false, requestRenderMode: true,
  });
  viewer.scene.skyAtmosphere.show = true;
  // Không dùng dịch vụ tìm địa chỉ nào khác ngoài Google, đúng điều khoản dùng 3D Tiles của Google.
  const tileset = await C.createGooglePhotorealistic3DTileset({ onlyUsingWithGoogleGeocoder: true });
  viewer.scene.primitives.add(tileset);
  const gold = C.Color.fromCssColorString('#D9BC86'), green = C.Color.fromCssColorString('#244B43');
  const entities = new Map<string, { show: boolean }>();
  places.forEach((p, i) => {
    entities.set(p.id, viewer.entities.add({
      id: p.id, name: p.name, position: C.Cartesian3.fromDegrees(p.lng, p.lat, 28),
      point: { pixelSize: 14, color: gold, outlineColor: green, outlineWidth: 3, heightReference: C.HeightReference.RELATIVE_TO_3D_TILE, disableDepthTestDistance: Number.POSITIVE_INFINITY },
      label: {
        text: `${i + 1}. ${p.name}`, font: '600 14px "Be Vietnam Pro", sans-serif', fillColor: C.Color.WHITE, outlineColor: C.Color.fromCssColorString('#12261F'), outlineWidth: 4,
        style: C.LabelStyle.FILL_AND_OUTLINE, pixelOffset: new C.Cartesian2(0, -22), heightReference: C.HeightReference.RELATIVE_TO_3D_TILE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY, distanceDisplayCondition: new C.DistanceDisplayCondition(0, 6000),
      },
    }));
  });
  const lines = tours.map(t => ({
    slug: t.slug,
    els: t.legs.map(l => viewer.entities.add({
      polyline: {
        positions: C.Cartesian3.fromDegreesArray((l.traced ? smoothLine(l.coords) : l.coords).flat()), width: l.traced ? 6 : 4, clampToGround: true,
        material: l.traced ? C.Color.fromCssColorString('#F3E7CD').withAlpha(0.95) : new C.PolylineDashMaterialProperty({ color: gold, dashLength: 14 }),
      },
    }) as { show: boolean }),
  }));
  viewer.selectedEntityChanged.addEventListener((e: { id?: string } | undefined) => { if (e?.id && entities.has(e.id)) onPick(e.id); });
  const sphere = (pts: { lat: number; lng: number }[], r: number) => C.BoundingSphere.fromPoints(pts.map(p => C.Cartesian3.fromDegrees(p.lng, p.lat, 0)), new C.BoundingSphere(C.Cartesian3.ZERO, r));
  const fly = (pts: { lat: number; lng: number }[], range?: number, pitch = -32) => {
    const bs = sphere(pts, 60);
    if (bs.radius < 60) bs.radius = 60;
    viewer.camera.flyToBoundingSphere(bs, { offset: new C.HeadingPitchRange(C.Math.toRadians(-25), C.Math.toRadians(pitch), range ?? Math.max(700, bs.radius * 3.2)), duration: reduceMotion() ? 0 : 2.6 });
  };
  fly(places);
  return {
    show(ids, routes, tourSlug) {
      entities.forEach((e, id) => { e.show = ids.has(id); });
      lines.forEach(t => t.els.forEach(l => { l.show = routes && (!tourSlug || tourSlug === t.slug); }));
      viewer.scene.requestRender();
    },
    focus(p, pts) { if (p) fly([p], 360, -30); else if (pts.length) fly(pts); },
    mark() { viewer.scene.requestRender(); },
    destroy() { if (!viewer.isDestroyed()) viewer.destroy(); },
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

  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const q = fold(query);
    return places.filter(p => (theme === 'all' || p.theme === theme) && (!tour || p.tours.some(t => t.slug === tour))
      && (!q || fold(`${p.name} ${p.kicker} ${p.dossier?.title ?? ''}`).includes(q)));
  }, [places, theme, tour, query]);
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
        const mounted = mode === '2d' ? await mount2D(el, places, tours, id => pick(id))
          : mode === 'google' ? await (hasGoogleMaps ? mountGoogle3D : mountCesium3D)(el, places, tours, id => pick(id))
          : await mount3D(el, places, tours, id => pick(id), mode);
        if (cancelled) { mounted.destroy(); return; }
        engine.current = mounted;
        setState('ready');
      } catch {
        if (cancelled) return;
        el.innerHTML = '';
        if (mode === 'google') { setNotice('Chưa mở được bản đồ 3D của Google (kiểm tra kết nối, mã Cesium ion hoặc khóa Google), đã chuyển sang 3D phố.'); setState('loading'); setMode('street'); }
        else if (mode !== '2d') { setNotice('Chưa mở được bản đồ 3D trên thiết bị này, đã chuyển về bản đồ 2D.'); setState('loading'); setMode('2d'); }
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
  const [street360, setStreet360] = useState(false);
  const close360 = useCallback(() => setStreet360(false), [setStreet360]);
  // Khóa Google sai hoặc chưa cho phép tên miền: đóng ảnh 360°, rời chế độ 3D Google về 3D phố miễn phí.
  useEffect(() => onGoogleAuthFailure(() => {
    setStreet360(false);
    if (mode !== 'google') return;
    setNotice('Khóa Google Maps chưa hợp lệ hoặc chưa cho phép tên miền này, đã chuyển sang 3D phố.');
    setState('loading');
    setMode('street');
  }), [mode]);
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
            <button type="button" aria-pressed={mode === 'street'} disabled={webgl === false} title={webgl === false ? 'Thiết bị chưa hỗ trợ WebGL nên chưa xem được 3D' : 'Đường phố, tên đường và khối nhà 3D'} onClick={() => switchMode('street')}>3D phố</button>
            {(hasGoogleMaps || hasCesium) && <button type="button" aria-pressed={mode === 'google'} disabled={webgl === false} title="Thành phố 3D chân thực từ ảnh chụp của Google" onClick={() => switchMode('google')}>3D Google</button>}
            <button type="button" aria-pressed={mode === 'satellite'} disabled={webgl === false} title={webgl === false ? 'Thiết bị chưa hỗ trợ WebGL nên chưa xem được 3D' : 'Ảnh vệ tinh nhìn nghiêng, kèm tên đường'} onClick={() => switchMode('satellite')}>3D vệ tinh</button>
          </div>
        </div>
      </div>
      {(notice || webgl === false) && <p className="atlas-notice" role="status">{notice || 'Thiết bị này chưa hỗ trợ WebGL nên chỉ hiện bản đồ 2D. Mọi thông tin địa điểm vẫn đầy đủ.'}</p>}

      <div className="atlas-body">
        <div className="atlas-stage">
          <div className="atlas-map" ref={mapEl} role="region" aria-label={`Bản đồ ${modeLabel[mode]} các điểm di sản. Dùng danh sách bên cạnh để chọn bằng bàn phím.`} />
          {state === 'loading' && <div className="atlas-note" aria-hidden="true"><span className="nb-loading"><span /><span /><span /><b>Đang tải bản đồ…</b></span></div>}
          {street360 && current && <StreetViewPanel key={current.id} lat={current.lat} lng={current.lng} name={current.name} onClose={close360} />}
          {state === 'failed' && <div className="atlas-note is-failed" role="status"><p>Chưa tải được bản đồ. Kiểm tra kết nối mạng rồi tải lại trang. Danh sách địa điểm bên cạnh vẫn dùng được.</p></div>}
          <div className="atlas-legend">
            <span><i className="ap-key coord-osm" />Tọa độ OSM, chờ đối chiếu</span>
            <span><i className="ap-key coord-reviewed" />Đã đối chiếu{reviewedCount ? ` (${reviewedCount})` : ' (chưa có)'}</span>
            <label className="atlas-routes"><input type="checkbox" checked={routes} onChange={e => setRoutes(e.target.checked)} />Thứ tự chặng</label>
            {mode === 'street' && <span className="atlas-legend-note"><i className="ap-key is-heritage" />Khối nhà tại điểm di sản · chiều cao nhà là ước lượng từ OpenStreetMap</span>}
          </div>
        </div>

        <aside className="atlas-panel" aria-label="Thông tin địa điểm">
          {!current ? (
            <>
              <div className="atlas-search">
                <label className="sr-only" htmlFor="atlas-q">Tìm địa điểm</label>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                <input id="atlas-q" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm địa điểm: chùa, chợ, Bình Thủy…" autoComplete="off" />
              </div>
              <p className="atlas-count" role="status">{visible.length} địa điểm{theme !== 'all' ? `, nhóm ${placeThemes[theme as PlaceTheme].toLowerCase()}` : ''}{query ? `, khớp “${query}”` : ''}</p>
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
              {!visible.length && <div className="atlas-empty"><p>Không có địa điểm nào khớp bộ lọc hoặc từ khóa.</p><button type="button" className="nb-text-button" onClick={() => { setTheme('all'); setTour(null); setQuery(''); }}>Bỏ bộ lọc</button></div>}
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
                {hasGoogleMaps && <button type="button" className="button outline" onClick={() => setStreet360(true)}>Ảnh 360° quanh đây</button>}
              </div>
              <p className="atlas-google">
                <span>Xem trên Google:</span>
                <a href={googleLinks(current).streetView} target="_blank" rel="noreferrer">Chế độ xem phố<span className="sr-only"> (mở thẻ mới)</span> ↗</a>
                <a href={googleLinks(current).earth} target="_blank" rel="noreferrer">Google Earth 3D<span className="sr-only"> (mở thẻ mới)</span> ↗</a>
              </p>
              {current.tours.map(t => <p key={t.slug} className="atlas-tour">{t.title}{t.draft && <span className="badge-draft">Bản nháp, chờ duyệt nguồn</span>}</p>)}
            </article>
          )}
        </aside>
      </div>
      <p className="atlas-foot">Đường nối giữa các điểm chỉ thể hiện thứ tự chặng, không phải lộ trình đã kiểm chứng. Chặng đi ghe được dò theo lòng sông từ ảnh vệ tinh. Khung bản đồ không thể hiện ranh giới hành chính.</p>
    </div>
  );
}
