'use client';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Map as MLMap, Marker as MLMarker, GeoJSONSource } from 'maplibre-gl';
import { GLOBE_VIEW, MAP_LOCALE, heritageStyle } from '@/lib/map-style';
import type { LegMode, MapSource, MapTour } from '@/lib/map-tours';

export type Leg = { mode: LegMode; label: string; note: string; distance: string };
type Props = { tour: MapTour; sources: Record<string, MapSource>; legs: Leg[]; length: string; others: { slug: string; title: string }[]; reading: { slug: string; title: string }[] };


/* ---------- Giọng đọc: lấy giọng tiếng Việt có sẵn trong trình duyệt ---------- */
const hasSpeech = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
function subscribeVoices(cb: () => void) {
  if (!hasSpeech()) return () => {};
  window.speechSynthesis.addEventListener('voiceschanged', cb);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', cb);
}
/** Tên giọng tiếng Việt tốt nhất; '#none' nếu trình duyệt không hỗ trợ, '#novi' nếu không có giọng tiếng Việt. */
function voiceSnapshot() {
  if (!hasSpeech()) return '#none';
  const vi = window.speechSynthesis.getVoices().filter(v => /^vi/i.test(v.lang));
  const best = vi.find(v => /natural|online|neural/i.test(v.name)) ?? vi.find(v => /google/i.test(v.name)) ?? vi[0];
  return best?.name ?? '#novi';
}
const voiceServer = () => '#ssr';

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 960px)').matches;
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function Icon({ name }: { name: 'play' | 'pause' | 'prev' | 'next' | 'sound' | 'stop' | 'globe' | 'cube' }) {
  const d: Record<string, string> = {
    play: 'M8 5v14l11-7z', pause: 'M7 5h4v14H7zM13 5h4v14h-4z', prev: 'M15 5 8 12l7 7', next: 'm9 5 7 7-7 7',
    sound: 'M4 9v6h4l5 4V5L8 9zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z', stop: 'M7 7h10v10H7z',
    globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.5 2.4 3.8 5.4 3.8 9s-1.3 6.6-3.8 9m0-18C9.5 5.4 8.2 8.4 8.2 12s1.3 6.6 3.8 9M3.5 9h17M3.5 15h17',
    cube: 'm12 3 8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12 4 7.5M12 12v9',
  };
  const filled = name === 'play' || name === 'pause' || name === 'stop' || name === 'sound';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d[name]} />
    </svg>
  );
}

export function TourPlayer({ tour, sources, legs, length, others, reading }: Props) {
  const stops = tour.stops;
  const last = stops.length - 1;
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markers = useRef<MLMarker[]>([]);
  const flight = useRef(0);
  const speech = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const playingRef = useRef(false);
  const goRef = useRef<(i: number) => void>(() => {});
  const panelRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [sentence, setSentence] = useState(-2);
  const [done, setDone] = useState(false);
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [buildings, setBuildings] = useState(true);
  const voice = useSyncExternalStore(subscribeVoices, voiceSnapshot, voiceServer);
  const canSpeak = !voice.startsWith('#');

  const activeIndex = useRef(-1);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { activeIndex.current = active; }, [active]);

  const stopSpeech = useCallback(() => {
    speech.current++;
    if (hasSpeech()) window.speechSynthesis.cancel();
    setSpeaking(false);
    setSentence(-2);
  }, []);

  const padding = useCallback(() => (wide() ? { left: 470, right: 70, top: 70, bottom: 150 } : { left: 30, right: 30, top: 50, bottom: 60 }), []);

  const overview = useCallback((duration = 2600) => {
    const map = mapRef.current;
    if (!map) return;
    const lngs = stops.map(s => s.lng), lats = stops.map(s => s.lat);
    map.stop();
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], {
      padding: padding(), pitch: 48, bearing: -12, maxZoom: 16.5, duration: reduceMotion() ? 0 : duration, essential: true,
    });
  }, [stops, padding]);

  /** Tự sang chặng sau khi đang ở chế độ tự chạy. */
  const advance = useCallback((i: number) => {
    window.clearTimeout(timer.current);
    if (!playingRef.current) return;
    if (i >= last) {
      setPlaying(false);
      setDone(true);
      timer.current = window.setTimeout(() => overview(4200), 1600);
      return;
    }
    timer.current = window.setTimeout(() => goRef.current(i + 1), 1400);
  }, [last, overview]);

  const speak = useCallback((i: number) => {
    if (!hasSpeech() || !canSpeak) return false;
    const synth = window.speechSynthesis;
    synth.cancel();
    const s = stops[i];
    const texts = [`Chặng ${i + 1}. ${s.name}.`, ...s.lines.map(l => l.text)];
    const v = synth.getVoices().find(x => x.name === voice);
    const token = ++speech.current;
    setSpeaking(true);
    texts.forEach((text, k) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = v?.lang ?? 'vi-VN';
      if (v) u.voice = v;
      u.rate = 0.98;
      u.onstart = () => { if (speech.current === token) setSentence(k - 1); };
      if (k === texts.length - 1) {
        const finish = () => {
          if (speech.current !== token) return;
          setSpeaking(false);
          setSentence(-2);
          advance(i);
        };
        u.onend = finish;
        u.onerror = finish;
      }
      synth.speak(u);
    });
    return true;
  }, [stops, canSpeak, voice, advance]);

  /** Camera tới nơi: xoay chậm quanh điểm, đọc thuyết minh hoặc chờ đủ thời gian đọc rồi sang chặng. */
  const arrive = useCallback((i: number) => {
    const map = mapRef.current;
    const s = stops[i];
    if (map && !reduceMotion()) map.easeTo({ bearing: s.camera.bearing + 28, duration: 32000, easing: t => t, padding: padding() });
    if (!playingRef.current) return;
    if (!speak(i)) {
      const words = s.lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => advance(i), Math.max(9000, words * 330));
    }
  }, [stops, speak, advance, padding]);

  const go = useCallback((i: number) => {
    window.clearTimeout(timer.current);
    stopSpeech();
    setDone(false);
    setActive(i);
    const url = `${window.location.pathname}${window.location.search}${i >= 0 ? `#chang-${i + 1}` : ''}`;
    window.history.replaceState(null, '', url);
    panelRef.current?.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
    const map = mapRef.current;
    if (i < 0) { overview(); return; }
    if (!map) { arrive(i); return; }
    const s = stops[i];
    const token = ++flight.current;
    map.stop();
    const from = map.getCenter();
    const far = Math.abs(from.lng - s.lng) + Math.abs(from.lat - s.lat) > 0.02;
    map.flyTo({
      center: [s.lng, s.lat], zoom: s.camera.zoom, pitch: s.camera.pitch, bearing: s.camera.bearing, padding: padding(),
      duration: reduceMotion() ? 0 : far ? 6200 : 3400, curve: far ? 1.6 : 1.2, essential: true,
    });
    map.once('moveend', () => { if (flight.current === token) arrive(i); });
  }, [stopSpeech, overview, arrive, stops, padding]);

  useEffect(() => { goRef.current = go; }, [go]);

  const startTour = () => { setPlaying(true); playingRef.current = true; go(active < 0 || done ? 0 : active); };
  const pauseTour = () => { setPlaying(false); playingRef.current = false; window.clearTimeout(timer.current); stopSpeech(); };
  const toggleListen = () => {
    if (speaking) { stopSpeech(); return; }
    if (active >= 0) speak(active);
  };

  /* ---------- Khởi tạo bản đồ ---------- */
  useEffect(() => {
    let cancelled = false;
    let map: MLMap | null = null;
    (async () => {
      try {
        const ml = await import('maplibre-gl');
        if (cancelled || !mapEl.current) return;
        const style = heritageStyle();
        map = new ml.Map({
          container: mapEl.current,
          style,
          center: GLOBE_VIEW.center,
          zoom: GLOBE_VIEW.zoom,
          maxPitch: 75,
          attributionControl: false,
          cooperativeGestures: true,
          locale: MAP_LOCALE,
        });
        mapRef.current = map;
        map.addControl(new ml.NavigationControl({ visualizePitch: true }), 'top-right');
        map.addControl(new ml.FullscreenControl({ container: mapEl.current.parentElement ?? undefined }), 'top-right');
        map.addControl(new ml.AttributionControl({ compact: true, customAttribution: 'Tọa độ: © OpenStreetMap' }), 'bottom-right');
        // Lỗi tải ô ảnh (mất mạng, nguồn khối nhà chậm) không làm hỏng tour.
        map.on('error', () => {});
        // Người dùng tự kéo, xoay: dừng vòng xoay chậm của camera.
        map.on('dragstart', () => map?.stop());

        stops.forEach((s, i) => {
          const el = document.createElement('button');
          el.type = 'button';
          el.className = 'tp-pin';
          el.setAttribute('aria-label', `Chặng ${i + 1}: ${s.name}`);
          el.innerHTML = `<b>${i + 1}</b><span>${escapeHtml(s.name)}</span>`;
          el.addEventListener('click', e => { e.stopPropagation(); goRef.current(i); });
          markers.current.push(new ml.Marker({ element: el, anchor: 'bottom' }).setLngLat([s.lng, s.lat]).addTo(map!));
        });

        map.on('load', () => {
          if (cancelled || !map) return;
          (map.getSource('route') as GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: stops.slice(1).map((s, k) => ({
              type: 'Feature', properties: { i: k },
              geometry: { type: 'LineString', coordinates: [[stops[k].lng, stops[k].lat], [s.lng, s.lat]] },
            })),
          });
          setMapState('ready');
          // Trên màn hình hẹp, thu gọn dòng ghi công thành nút (i) để không che dải chặng.
          if (!wide()) map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
          const m = window.location.hash.match(/^#chang-(\d+)$/);
          const start = m ? Math.min(Math.max(Number(m[1]) - 1, 0), last) : -1;
          window.setTimeout(() => (start >= 0 ? goRef.current(start) : overview(5200)), 500);
        });
      } catch {
        if (!cancelled) setMapState('failed');
      }
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(timer.current);
      if (hasSpeech()) window.speechSynthesis.cancel();
      markers.current = [];
      map?.remove();
      mapRef.current = null;
    };
  }, [stops, last, overview]);

  /* ---------- Đồng bộ trạng thái chặng lên bản đồ ---------- */
  useEffect(() => {
    markers.current.forEach((m, k) => {
      const el = m.getElement();
      el.classList.toggle('is-active', k === active);
      el.classList.toggle('is-past', active >= 0 && k < active);
      if (k === active) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    });
    const map = mapRef.current;
    if (!map || mapState !== 'ready') return;
    map.setFilter('route-done', ['<', ['get', 'i'], active]);
    const s = active >= 0 ? stops[active] : null;
    (map.getSource('focus') as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: s ? [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [s.lng, s.lat] } }] : [],
    });
  }, [active, mapState, stops]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && mapState === 'ready') map.setLayoutProperty('buildings', 'visibility', buildings ? 'visible' : 'none');
  }, [buildings, mapState]);

  /* ---------- Phím tắt ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goRef.current(Math.min(activeIndex.current + 1, last)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goRef.current(Math.max(activeIndex.current - 1, -1)); }
      if (e.key === 'Escape') goRef.current(-1);
    };
    const onHash = () => {
      const m = window.location.hash.match(/^#chang-(\d+)$/);
      if (m) { goRef.current(Math.min(Math.max(Number(m[1]) - 1, 0), last)); window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHash);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', onHash); };
  }, [last]);

  const stop = active >= 0 ? stops[active] : null;
  const leg = active >= 0 && active < last ? legs[active] : null;
  const usedSources = stop ? [...new Set(stop.lines.flatMap(l => l.src))].map(id => sources[id]).filter(Boolean) : [];
  const voiceNote = voice === '#ssr' ? null
    : voice === '#none' ? 'Trình duyệt này không có chức năng đọc thành tiếng; tour vẫn chạy với chú thích chữ.'
    : voice === '#novi' ? 'Máy này chưa cài giọng đọc tiếng Việt, nên tour chạy với chú thích chữ. Trên Windows, có thể thêm giọng tiếng Việt trong Cài đặt, mục Ngôn ngữ.'
    : 'Thuyết minh dùng giọng đọc máy có sẵn trong trình duyệt của bạn, không phải giọng người thật.';

  return (
    <div className={`tp ${active >= 0 ? 'is-stop' : 'is-intro'}`}>
      <div className="tp-stage">
        <div className="tp-map" ref={mapEl} role="application" aria-label={`Bản đồ 3D của tour ${tour.title}. Dùng phím mũi tên trái, phải để chuyển chặng.`} />
        {mapState === 'loading' && <div className="tp-map-note" aria-hidden="true">Đang mở địa cầu…</div>}
        {mapState === 'failed' && (
          <div className="tp-map-note is-failed" role="status">
            Trình duyệt chưa hiển thị được bản đồ 3D (cần WebGL). Bạn vẫn đọc được toàn bộ thuyết minh và nguồn ở khung bên cạnh.
          </div>
        )}
        <div className="tp-tools" role="group" aria-label="Chế độ xem">
          <button type="button" onClick={() => go(-1)} aria-pressed={active < 0}><Icon name="globe" /> Toàn tuyến</button>
          <button type="button" onClick={() => setBuildings(b => !b)} aria-pressed={buildings}><Icon name="cube" /> Khối nhà 3D</button>
        </div>
        <ol className="tp-rail" aria-label="Các chặng của tour">
          {stops.map((s, i) => (
            <li key={s.id} className={i === active ? 'is-active' : i < active ? 'is-past' : ''}>
              <button type="button" onClick={() => go(i)} aria-current={i === active ? 'step' : undefined}>
                <b>{i + 1}</b><span>{s.name}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="tp-legend">Nét đứt chỉ để định hướng giữa các chặng, không phải đường đi thực tế.</p>
      </div>

      <section className="tp-panel" ref={panelRef} aria-live="polite" aria-label="Thuyết minh">
        <div className="tp-panel-top">
          <span className="tp-kicker">{tour.kicker}</span>
          {tour.review === 'draft' && <span className="tp-draft" title="Nội dung đã dẫn nguồn nhưng chưa qua bước duyệt cuối của ban biên tập">Bản nháp · chờ duyệt nguồn</span>}
        </div>

        {!stop ? (
          <div className="tp-intro">
            <h1>{tour.title}</h1>
            <p className="tp-lede">{tour.summary}</p>
            <ul className="tp-meta">
              <li><span>Khu vực</span>{tour.area}</li>
              <li><span>Chiều dài</span>{length} đường chim bay</li>
              <li><span>Thời lượng</span>{tour.duration}</li>
            </ul>
            <ol className="tp-stoplist">
              {stops.map((s, i) => (
                <li key={s.id}>
                  <button type="button" onClick={() => go(i)}>
                    <b>{i + 1}</b>
                    <span><strong>{s.name}</strong><em>{s.kicker}</em></span>
                  </button>
                  {i < last && <small>{legs[i].label} · {legs[i].distance}</small>}
                </li>
              ))}
            </ol>
            {done && <p className="tp-done">Bạn đã đi hết tuyến. Chọn một chặng để xem lại, hoặc mở tour khác bên dưới.</p>}
            {voiceNote && <p className="tp-voice-note">{voiceNote}</p>}
          </div>
        ) : (
          <article className="tp-stop" key={stop.id}>
            <p className="tp-count">Chặng {active + 1} <span>/ {stops.length}</span></p>
            <h2>{stop.name}</h2>
            <p className="tp-stop-kicker">{stop.kicker}</p>
            {stop.image && (
              <figure className="tp-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stop.image.src} alt={`Ảnh tư liệu: ${stop.name}`} loading="lazy" />
                <figcaption>{stop.image.credit}</figcaption>
              </figure>
            )}
            <p className="tp-narration">
              {stop.lines.map((l, k) => (
                <span key={k} className={sentence === k ? 'is-reading' : undefined}>
                  {l.text}
                  {(k === stop.lines.length - 1 || l.src.join() !== stop.lines[k + 1].src.join()) && l.src.map(id => <sup key={id}><a href={`#nguon-${id}`} aria-label={`Nguồn: ${sources[id]?.publisher ?? id}`}>{Object.keys(sources).indexOf(id) + 1}</a></sup>)}{' '}
                </span>
              ))}
            </p>
            <dl className="tp-facts">
              {stop.facts.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
            </dl>
            {stop.dossier && <p><a className="tp-link" href={`/ho-so/${stop.dossier.slug}`}>Đọc hồ sơ đầy đủ về {stop.name} »</a></p>}
            {leg && (
              <p className="tp-next">
                <span>Tiếp theo</span>
                <strong>{stops[active + 1].name}</strong>
                <em>{leg.label} · khoảng {leg.distance} · {leg.note}</em>
              </p>
            )}
            {usedSources.length > 0 && (
              <details className="tp-sources">
                <summary>Nguồn của chặng này ({usedSources.length})</summary>
                <ol>
                  {usedSources.map(src => (
                    <li key={src.id}><a href={src.url} target="_blank" rel="noreferrer">{src.title}</a>, {src.publisher}{src.date ? `, ${src.date}` : ''}</li>
                  ))}
                </ol>
              </details>
            )}
          </article>
        )}

        <div className="tp-controls" role="group" aria-label="Điều khiển tour">
          <button type="button" className="tp-icon" onClick={() => go(Math.max(active - 1, -1))} disabled={active < 0} aria-label="Chặng trước"><Icon name="prev" /></button>
          {playing
            ? <button type="button" className="tp-main" onClick={pauseTour}><Icon name="pause" /> Tạm dừng</button>
            : <button type="button" className="tp-main" onClick={startTour}><Icon name="play" /> {active < 0 || done ? 'Bắt đầu tour' : 'Tự chạy tiếp'}</button>}
          {active >= 0 && canSpeak && (
            <button type="button" className="tp-ghost" onClick={toggleListen} aria-pressed={speaking}>
              <Icon name={speaking ? 'stop' : 'sound'} /> {speaking ? 'Dừng đọc' : 'Nghe'}
            </button>
          )}
          <button type="button" className="tp-icon" onClick={() => go(Math.min(active + 1, last))} disabled={active >= last} aria-label="Chặng tiếp"><Icon name="next" /></button>
        </div>
        {(others.length > 0 || reading.length > 0) && active < 0 && (
          <div className="tp-more">
            {others.map(o => <a key={o.slug} href={`/hanh-trinh/${o.slug}`}>Tour khác: {o.title} »</a>)}
            {reading.map(o => <a key={o.slug} href={`/hanh-trinh/${o.slug}`}>Đọc kèm: {o.title} »</a>)}
          </div>
        )}
      </section>
    </div>
  );
}
