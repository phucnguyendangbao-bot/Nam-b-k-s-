'use client';
import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, metersBetween, onGoogleAuthFailure } from '@/lib/google-maps';

type State = { kind: 'loading' } | { kind: 'ready'; distance: number; copyright?: string; date?: string } | { kind: 'none' } | { kind: 'error'; message: string };

/**
 * Ảnh 360° của Google quanh một điểm (Chế độ xem phố). Tìm ảnh gần nhất trong bán kính cho trước,
 * gồm cả ảnh chính thức lẫn ảnh 360° người dùng đăng lên Google Maps; ghi rõ khoảng cách và người chụp.
 */
export function StreetViewPanel({ lat, lng, name, radius = 150, onClose }: { lat: number; lng: number; name: string; radius?: number; onClose: () => void }) {
  const view = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const off = onGoogleAuthFailure(() => { if (!cancelled) setState({ kind: 'error', message: 'Khóa Google Maps chưa hợp lệ hoặc chưa cho phép tên miền này.' }); });
    (async () => {
      try {
        const g = await loadGoogleMaps();
        const sv = await g.maps.importLibrary('streetView');
        const res = await new sv.StreetViewService().getPanorama({
          location: { lat, lng }, radius, preference: sv.StreetViewPreference?.NEAREST ?? 'nearest', sources: [sv.StreetViewSource?.DEFAULT ?? 'default'],
        }).catch(() => null);
        if (cancelled) return;
        const pano = res?.data.location?.pano;
        const at = res?.data.location?.latLng;
        if (!pano || !view.current) { setState({ kind: 'none' }); return; }
        new sv.StreetViewPanorama(view.current, {
          pano, pov: { heading: 0, pitch: 0 }, zoom: 0, addressControl: false, fullscreenControl: true, motionTracking: false, motionTrackingControl: false, showRoadLabels: true,
        });
        setState({ kind: 'ready', distance: at ? Math.round(metersBetween({ lat, lng }, { lat: at.lat(), lng: at.lng() })) : 0, copyright: res?.data.copyright, date: res?.data.imageDate });
      } catch (e) {
        if (!cancelled) setState({ kind: 'error', message: e instanceof Error ? e.message : 'Không mở được ảnh 360°.' });
      }
    })();
    return () => { cancelled = true; off(); };
  }, [lat, lng, radius]);

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sv-panel" role="dialog" aria-label={`Ảnh 360° quanh ${name}`}>
      <div className="sv-head">
        <p><strong>Ảnh 360° quanh {name}</strong>
          {state.kind === 'ready' && <span>Cách điểm khoảng {state.distance} m{state.date ? ` · chụp ${state.date.split('-').reverse().join('/')}` : ''}{state.copyright ? ` · ${state.copyright}` : ''}</span>}
        </p>
        <button ref={closeBtn} type="button" className="sv-close" onClick={onClose}>Đóng</button>
      </div>
      <div className="sv-view" ref={view} />
      {state.kind === 'loading' && <p className="sv-note" role="status">Đang tìm ảnh 360° gần nhất…</p>}
      {state.kind === 'none' && <p className="sv-note" role="status">Google chưa có ảnh 360° trong bán kính {radius} m quanh điểm này. Ảnh 360° ở Cần Thơ còn ít; bạn vẫn xem được điểm này ở chế độ 3D.</p>}
      {state.kind === 'error' && <p className="sv-note is-error" role="alert">{state.message}</p>}
    </div>
  );
}
