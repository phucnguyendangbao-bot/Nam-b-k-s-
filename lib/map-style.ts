import type { StyleSpecification } from 'maplibre-gl';

/** Ảnh vệ tinh Esri (không cần khóa); ô ảnh trên mức 18 được phóng từ mức 18 để tránh ô "chưa có dữ liệu". */
export const SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const GLOBE_VIEW = { center: [106.2, 13.2] as [number, number], zoom: 2.4 };

export const MAP_LOCALE = {
  'NavigationControl.ZoomIn': 'Phóng to', 'NavigationControl.ZoomOut': 'Thu nhỏ', 'NavigationControl.ResetBearing': 'Xoay về hướng bắc',
  'FullscreenControl.Enter': 'Xem toàn màn hình', 'FullscreenControl.Exit': 'Thoát toàn màn hình',
  'AttributionControl.ToggleAttribution': 'Ghi công bản đồ',
  'CooperativeGesturesHandler.WindowsHelpText': 'Giữ Ctrl và cuộn chuột để phóng to, thu nhỏ bản đồ',
  'CooperativeGesturesHandler.MacHelpText': 'Giữ ⌘ và cuộn chuột để phóng to, thu nhỏ bản đồ',
  'CooperativeGesturesHandler.MobileHelpText': 'Dùng hai ngón tay để di chuyển bản đồ',
};

/** Không dùng khối nhà OpenStreetMap: dữ liệu nhà ở Cần Thơ còn quá thưa (vài khối mỗi ô), dễ gây hiểu lầm.
 *  Kiểu bản đồ dùng chung: địa cầu, bầu trời, ảnh vệ tinh, lớp tuyến và vòng tiêu điểm. */
export function heritageStyle(): StyleSpecification {
  return {
    version: 8,
    projection: { type: 'globe' },
    sky: {
      'sky-color': '#1b2633', 'horizon-color': '#d9c9a3', 'fog-color': '#e9dcc0',
      'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.88,
      'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 1, 12, 0],
    },
    sources: {
      satellite: {
        type: 'raster', tiles: [SATELLITE], tileSize: 256, maxzoom: 18,
        attribution: 'Powered by <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a> · Ảnh vệ tinh: Esri, Maxar, Earthstar Geographics và cộng đồng GIS',
      },
      route: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      focus: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#13100d' } },
      { id: 'satellite', type: 'raster', source: 'satellite', paint: { 'raster-saturation': -0.18, 'raster-contrast': 0.06, 'raster-brightness-max': 0.92, 'raster-fade-duration': 240 } },
      { id: 'focus-ring', type: 'circle', source: 'focus', paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 10, 18, 70], 'circle-color': '#c8a465', 'circle-opacity': 0.14, 'circle-stroke-color': '#e9d3a2', 'circle-stroke-width': 1.5, 'circle-stroke-opacity': 0.8, 'circle-pitch-alignment': 'map' } },
      { id: 'route-glow', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#c8a465', 'line-width': 9, 'line-opacity': 0.18, 'line-blur': 4 } },
      { id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#f3e7cd', 'line-width': 2, 'line-opacity': 0.85, 'line-dasharray': [1.5, 2] } },
      { id: 'route-done', type: 'line', source: 'route', filter: ['<', ['get', 'i'], 0], layout: { 'line-cap': 'round' }, paint: { 'line-color': '#d8b46a', 'line-width': 3.2 } },
    ],
  };
}
