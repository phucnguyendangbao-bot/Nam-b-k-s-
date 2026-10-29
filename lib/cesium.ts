/**
 * Thành phố 3D chân thực của Google, phát qua Cesium ion (gói Community miễn phí, không cần thẻ:
 * khoảng 1.000 lượt mở mỗi tháng, dành cho mục đích cá nhân, phi thương mại).
 * Mã thông báo đặt ở NEXT_PUBLIC_CESIUM_ION_TOKEN (giới hạn tên miền trong trang quản lý token của Cesium ion).
 * CesiumJS nặng nên chỉ tải từ CDN khi người đọc chủ động chọn chế độ này.
 */
export const CESIUM_TOKEN = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN ?? '';
export const hasCesium = CESIUM_TOKEN.length > 0;
const VERSION = '1.145.0';
const BASE = `https://cdn.jsdelivr.net/npm/cesium@${VERSION}/Build/Cesium/`;

// CesiumJS không đi kèm kiểu trong dự án (không cài gói npm để giữ bundle nhẹ), nên dùng kiểu lỏng ở đúng chỗ này.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CesiumNS = any;
type CesiumWindow = Window & { Cesium?: CesiumNS; CESIUM_BASE_URL?: string };

let loading: Promise<CesiumNS> | null = null;

export function loadCesium(): Promise<CesiumNS> {
  const w = window as CesiumWindow;
  if (!hasCesium) return Promise.reject(new Error('Chưa cấu hình mã Cesium ion.'));
  if (w.Cesium) return Promise.resolve(w.Cesium);
  loading ??= new Promise<CesiumNS>((resolve, reject) => {
    w.CESIUM_BASE_URL = BASE;
    if (!document.querySelector('link[data-cesium]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = `${BASE}Widgets/widgets.css`;
      css.dataset.cesium = '';
      document.head.appendChild(css);
    }
    const s = document.createElement('script');
    s.src = `${BASE}Cesium.js`;
    s.async = true;
    s.onload = () => {
      if (!w.Cesium) { loading = null; reject(new Error('CesiumJS không sẵn sàng.')); return; }
      w.Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;
      resolve(w.Cesium);
    };
    s.onerror = () => { loading = null; reject(new Error('Không tải được CesiumJS.')); };
    document.head.appendChild(s);
  });
  return loading;
}
