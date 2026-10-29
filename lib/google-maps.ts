/**
 * Nạp Google Maps JavaScript API khi người đọc chủ động chọn chế độ Google (3D chân thực, ảnh 360°).
 * Khóa đặt ở biến môi trường NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (khóa trình duyệt, nên giới hạn theo tên miền trong
 * Google Cloud Console). Không có khóa thì các nút Google không hiện, phần còn lại của bản đồ vẫn chạy bình thường.
 * Không dùng thư viện ngoài: một thẻ script với `callback`, chỉ nạp một lần.
 */
export const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
export const hasGoogleMaps = GOOGLE_MAPS_KEY.length > 0;

export type LatLngAlt = { lat: number; lng: number; altitude?: number };
type Ctor<T = HTMLElement> = new (options?: Record<string, unknown>) => T;

export type Map3D = HTMLElement & {
  flyCameraTo(options: { endCamera: { center: LatLngAlt; range?: number; tilt?: number; heading?: number }; durationMillis?: number }): void;
  flyCameraAround?(options: { camera: { center: LatLngAlt; range?: number; tilt?: number; heading?: number }; durationMillis?: number; repeatCount?: number }): void;
  stopCameraAnimation?(): void;
};
export type Maps3DLibrary = {
  Map3DElement: Ctor<Map3D>;
  Marker3DInteractiveElement: Ctor;
  Polyline3DElement: Ctor;
  MapMode: Record<string, string>;
  AltitudeMode: Record<string, string>;
  GestureHandling?: Record<string, string>;
};
export type StreetViewData = { location?: { pano?: string; latLng?: { lat(): number; lng(): number }; description?: string }; copyright?: string; imageDate?: string };
export type StreetViewLibrary = {
  StreetViewService: new () => { getPanorama(request: Record<string, unknown>): Promise<{ data: StreetViewData }> };
  StreetViewPanorama: new (el: HTMLElement, options: Record<string, unknown>) => { setVisible(v: boolean): void };
  StreetViewSource: Record<string, string>;
  StreetViewPreference: Record<string, string>;
};
type GoogleNS = { maps: { importLibrary(name: 'maps3d'): Promise<Maps3DLibrary>; importLibrary(name: 'streetView'): Promise<StreetViewLibrary> } };
type GoogleWindow = Window & { google?: GoogleNS; __nbsGoogleReady?: () => void; gm_authFailure?: () => void };

let loading: Promise<GoogleNS> | null = null;
let authFailed = false;
const authListeners = new Set<() => void>();

/** Google gọi hàm này khi khóa sai, chưa bật API, hoặc tên miền chưa được cho phép. */
export function onGoogleAuthFailure(cb: () => void) { authListeners.add(cb); if (authFailed) cb(); return () => { authListeners.delete(cb); }; }

export function loadGoogleMaps(): Promise<GoogleNS> {
  const w = window as GoogleWindow;
  if (!hasGoogleMaps) return Promise.reject(new Error('Chưa cấu hình khóa Google Maps.'));
  if (w.google?.maps?.importLibrary) return Promise.resolve(w.google);
  loading ??= new Promise<GoogleNS>((resolve, reject) => {
    w.gm_authFailure = () => { authFailed = true; authListeners.forEach(cb => cb()); };
    w.__nbsGoogleReady = () => (w.google ? resolve(w.google) : reject(new Error('Google Maps không sẵn sàng.')));
    const params = new URLSearchParams({ key: GOOGLE_MAPS_KEY, v: 'weekly', language: 'vi', region: 'VN', loading: 'async', callback: '__nbsGoogleReady' });
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    s.async = true;
    s.onerror = () => { loading = null; reject(new Error('Không tải được Google Maps.')); };
    document.head.appendChild(s);
  });
  return loading;
}

/** Khoảng cách (m) giữa hai tọa độ, đủ chính xác ở phạm vi một thành phố. */
export function metersBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Liên kết mở đúng vị trí trên ứng dụng của Google, không cần khóa API và không tốn phí:
 * - Ảnh 360° (Chế độ xem phố): Google tự tìm ảnh gần nhất quanh tọa độ.
 * - Google Earth 3D: góc nhìn nghiêng ~60°, cách mặt đất khoảng 600 m.
 */
export function googleLinks(p: { lat: number; lng: number }) {
  const at = `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
  return {
    streetView: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${at}`,
    earth: `https://earth.google.com/web/@${at},10a,600d,35y,0h,60t,0r`,
    satellite: `https://www.google.com/maps/@?api=1&map_action=map&center=${at}&zoom=18&basemap=satellite`,
  };
}
