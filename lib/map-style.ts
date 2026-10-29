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

/**
 * Bản đồ vector OpenFreeMap (lược đồ OpenMapTiles, dữ liệu OpenStreetMap): miễn phí, không cần khóa.
 * Khối nhà ở Ninh Kiều và Bình Thủy đã khá dày; phần lớn không có số tầng nên chiều cao là ước lượng mặc định (≈5 m).
 */
export const OFM_TILES = 'https://tiles.openfreemap.org/planet';
export const OFM_GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
export type MapLook = 'street' | 'satellite';

const NAME = ['coalesce', ['get', 'name:vi'], ['get', 'name']] as unknown as string;
const z = (...stops: number[]) => ['interpolate', ['exponential', 1.5], ['zoom'], ...stops] as unknown as number;

/** Lớp tuyến tour, vòng tiêu điểm: dùng chung cho cả hai kiểu nền, luôn nằm trên cùng. */
function overlayLayers(look: MapLook): StyleSpecification['layers'] {
  const light = look === 'satellite';
  const line = light ? '#f3e7cd' : '#244B43';
  const glow = light ? '#c8a465' : '#B79358';
  return [
    { id: 'focus-ring', type: 'circle', source: 'focus', paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 10, 18, 70], 'circle-color': glow, 'circle-opacity': light ? 0.14 : 0.18, 'circle-stroke-color': light ? '#e9d3a2' : '#B79358', 'circle-stroke-width': 1.5, 'circle-stroke-opacity': 0.9, 'circle-pitch-alignment': 'map' } },
    { id: 'route-glow', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': glow, 'line-width': 9, 'line-opacity': light ? 0.18 : 0.22, 'line-blur': 4 } },
    { id: 'route-line', type: 'line', source: 'route', filter: ['!', ['get', 'traced']], layout: { 'line-cap': 'round' }, paint: { 'line-color': line, 'line-width': 2.2, 'line-opacity': 0.9, 'line-dasharray': [1.5, 2] } },
    { id: 'route-river', type: 'line', source: 'route', filter: ['get', 'traced'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': line, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.8, 16, 3.4], 'line-opacity': 0.92 } },
    { id: 'route-done', type: 'line', source: 'route', filter: ['<', ['get', 'i'], 0], layout: { 'line-cap': 'round' }, paint: { 'line-color': light ? '#d8b46a' : '#B79358', 'line-width': 3.4 } },
  ];
}

/** Nhãn tên đường, sông rạch, khu vực — tiếng Việt, đặt theo đường. */
function labelLayers(look: MapLook): StyleSpecification['layers'] {
  const sat = look === 'satellite';
  const text = sat ? '#ffffff' : '#2d2d32';
  const halo = sat ? 'rgba(0,0,0,.72)' : 'rgba(255,255,255,.95)';
  return [
    { id: 'water-name-line', type: 'symbol', source: 'omt', 'source-layer': 'waterway', minzoom: 12, filter: ['all', ['has', 'name'], ['in', ['get', 'class'], ['literal', ['river', 'canal']]]],
      layout: { 'symbol-placement': 'line', 'symbol-spacing': 360, 'text-field': NAME, 'text-font': ['Noto Sans Italic'], 'text-size': z(12, 11, 17, 15), 'text-letter-spacing': 0.04, 'text-max-angle': 30 },
      paint: { 'text-color': sat ? '#d8f0f6' : '#2f6f80', 'text-halo-color': sat ? 'rgba(0,30,40,.7)' : 'rgba(255,255,255,.9)', 'text-halo-width': 1.4 } },
    { id: 'water-name-area', type: 'symbol', source: 'omt', 'source-layer': 'water_name', filter: ['all', ['has', 'name'], ['==', ['geometry-type'], 'Point']],
      layout: { 'text-field': NAME, 'text-font': ['Noto Sans Italic'], 'text-size': z(10, 11, 16, 15), 'text-letter-spacing': 0.06 },
      paint: { 'text-color': sat ? '#d8f0f6' : '#2f6f80', 'text-halo-color': sat ? 'rgba(0,30,40,.7)' : 'rgba(255,255,255,.9)', 'text-halo-width': 1.4 } },
    { id: 'water-name-area-line', type: 'symbol', source: 'omt', 'source-layer': 'water_name', filter: ['all', ['has', 'name'], ['!=', ['geometry-type'], 'Point']],
      layout: { 'symbol-placement': 'line', 'text-field': NAME, 'text-font': ['Noto Sans Italic'], 'text-size': z(10, 11, 16, 15), 'text-letter-spacing': 0.06 },
      paint: { 'text-color': sat ? '#d8f0f6' : '#2f6f80', 'text-halo-color': sat ? 'rgba(0,30,40,.7)' : 'rgba(255,255,255,.9)', 'text-halo-width': 1.4 } },
    { id: 'road-name', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 14, filter: ['all', ['any', ['has', 'name'], ['has', 'ref']], ['!', ['in', ['get', 'class'], ['literal', ['path', 'track', 'ferry', 'rail', 'transit']]]]],
      layout: { 'symbol-placement': 'line', 'symbol-spacing': 280, 'text-field': ['coalesce', ['get', 'name:vi'], ['get', 'name'], ['get', 'ref']] as unknown as string, 'text-font': ['Noto Sans Regular'], 'text-size': z(14, 11, 18, 15.5), 'text-max-angle': 35, 'text-padding': 4 },
      paint: { 'text-color': text, 'text-halo-color': halo, 'text-halo-width': 1.6, 'text-halo-blur': 0.4 } },
    // Địa danh nhỏ giúp định hướng khi đi phố: nơi thờ tự, chợ, bến, bảo tàng, trường… (chỉ chữ, không biểu tượng).
    { id: 'poi-landmark', type: 'symbol', source: 'omt', 'source-layer': 'poi', minzoom: 16,
      filter: ['all', ['has', 'name'], ['in', ['get', 'class'], ['literal', ['place_of_worship', 'museum', 'attraction', 'monument', 'castle', 'marketplace', 'ferry_terminal', 'harbor', 'college', 'school', 'hospital', 'park', 'town_hall']]]],
      layout: { 'text-field': NAME, 'text-font': ['Noto Sans Regular'], 'text-size': 11.5, 'text-max-width': 9, 'text-padding': 6, 'symbol-sort-key': ['coalesce', ['get', 'rank'], 99] },
      paint: { 'text-color': sat ? '#fff7e6' : ['match', ['get', 'class'], ['place_of_worship', 'museum', 'monument', 'castle', 'attraction'], '#84642C', ['marketplace', 'ferry_terminal', 'harbor'], '#2f6f80', '#6e6e73'] as unknown as string, 'text-halo-color': halo, 'text-halo-width': 1.4 } },
    { id: 'place-small', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 11, filter: ['in', ['get', 'class'], ['literal', ['suburb', 'quarter', 'neighbourhood', 'village', 'hamlet', 'island']]],
      layout: { 'text-field': NAME, 'text-font': ['Noto Sans Bold'], 'text-size': z(11, 11, 16, 14), 'text-letter-spacing': 0.03, 'text-max-width': 8 },
      paint: { 'text-color': sat ? '#fff' : '#5a5a60', 'text-halo-color': halo, 'text-halo-width': 1.6 } },
    { id: 'place-city', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 5, maxzoom: 15, filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
      layout: { 'text-field': NAME, 'text-font': ['Noto Sans Bold'], 'text-size': z(6, 12, 13, 19) },
      paint: { 'text-color': sat ? '#fff' : '#1d1d1f', 'text-halo-color': halo, 'text-halo-width': 1.8 } },
  ];
}

/** Bản đồ phố: nền sáng, đường có viền, sông rạch xanh nhạt, khối nhà 3D, nhãn tiếng Việt. */
function streetLayers(): StyleSpecification['layers'] {
  const roadClass = (classes: string[]) => ['in', ['get', 'class'], ['literal', classes]] as unknown as boolean;
  const notTunnel = ['!=', ['get', 'brunnel'], 'tunnel'] as unknown as boolean;
  const major = ['motorway', 'trunk', 'primary'];
  const mid = ['secondary', 'tertiary'];
  const minor = ['minor', 'service'];
  const width = (k: number) => z(12, 0.5 * k, 14, 1.4 * k, 16, 4 * k, 18, 12 * k);
  return [
    { id: 'bg', type: 'background', paint: { 'background-color': '#F3F1EC' } },
    { id: 'landuse', type: 'fill', source: 'omt', 'source-layer': 'landuse', filter: ['in', ['get', 'class'], ['literal', ['residential', 'commercial', 'retail', 'industrial']]], paint: { 'fill-color': '#ECE8E0', 'fill-opacity': 0.8 } },
    { id: 'landuse-civic', type: 'fill', source: 'omt', 'source-layer': 'landuse', filter: ['in', ['get', 'class'], ['literal', ['school', 'university', 'hospital', 'cemetery', 'religious']]], paint: { 'fill-color': '#EDE4D3', 'fill-opacity': 0.9 } },
    { id: 'landcover', type: 'fill', source: 'omt', 'source-layer': 'landcover', paint: { 'fill-color': ['match', ['get', 'class'], 'wood', '#CFE0C3', 'wetland', '#D3E5DB', 'farmland', '#EEF0DE', 'sand', '#F1EAD6', '#DDE9D3'], 'fill-opacity': 0.75 } },
    { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': '#D6E7CC', 'fill-opacity': 0.8 } },
    { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': '#AFD4DE' } },
    { id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway', filter: notTunnel, layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#AFD4DE', 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'],
        10, ['match', ['get', 'class'], ['river', 'canal'], 1, 0.3], 14, ['match', ['get', 'class'], ['river', 'canal'], 4, 1.2], 18, ['match', ['get', 'class'], ['river', 'canal'], 18, 5]] as unknown as number } },
    { id: 'road-path', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 15, filter: roadClass(['path', 'track']), paint: { 'line-color': '#CFC6B4', 'line-width': z(15, 0.8, 18, 2), 'line-dasharray': [2, 1.5] } },
    { id: 'road-minor-case', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 13, filter: ['all', notTunnel, roadClass(minor)], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#DCD5C7', 'line-width': z(13, 1, 16, 6, 18, 18) } },
    { id: 'road-minor', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 13, filter: ['all', notTunnel, roadClass(minor)], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#FFFFFF', 'line-width': z(13, 0.5, 16, 4.5, 18, 15) } },
    { id: 'road-mid-case', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['all', notTunnel, roadClass(mid)], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#D6CBB5', 'line-width': width(1.35) } },
    { id: 'road-mid', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['all', notTunnel, roadClass(mid)], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#FFFFFF', 'line-width': width(1.05) } },
    { id: 'road-major-case', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['all', notTunnel, roadClass(major)], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#D9BF86', 'line-width': width(1.7) } },
    { id: 'road-major', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['all', notTunnel, roadClass(major)], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#FBEFD2', 'line-width': width(1.4) } },
    { id: 'rail', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: roadClass(['rail', 'transit']), paint: { 'line-color': '#BDB6A8', 'line-width': 1.2, 'line-dasharray': [3, 2] } },
    { id: 'ferry', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: roadClass(['ferry']), paint: { 'line-color': '#6FA6B8', 'line-width': 1.2, 'line-dasharray': [2, 2] } },
    { id: 'building-flat', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 13, maxzoom: 15.5, paint: { 'fill-color': '#E2DDD3', 'fill-outline-color': '#D5CFC2' } },
    {
      id: 'building-3d', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 14.5, filter: ['!', ['has', 'hide_3d']],
      paint: {
        // Nhà trùng vị trí điểm di sản được tô vàng (feature-state đặt từ mã bản đồ).
        'fill-extrusion-color': ['case', ['boolean', ['feature-state', 'heritage'], false], '#C9A35E',
          ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 5], 0, '#E9E4DA', 12, '#DDD5C7', 40, '#C9C0B0']],
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14.5, 0, 15.5, ['coalesce', ['get', 'render_height'], 5]],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.94,
        'fill-extrusion-vertical-gradient': true,
      },
    },
  ];
}

/** Ảnh vệ tinh kèm lớp đường và nhãn mảnh (kiểu “lai”) để vẫn đọc được tên đường, tên sông khi nhìn ảnh. */
function satelliteLayers(): StyleSpecification['layers'] {
  return [
    { id: 'bg', type: 'background', paint: { 'background-color': '#13100d' } },
    { id: 'satellite', type: 'raster', source: 'satellite', paint: { 'raster-saturation': -0.12, 'raster-contrast': 0.08, 'raster-brightness-max': 0.95, 'raster-fade-duration': 240 } },
    { id: 'road-overlay', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 13, filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0.25, 17, 0.45], 'line-width': z(13, 0.6, 16, 2, 18, 5) } },
  ];
}

/** Kiểu bản đồ dùng chung cho bản đồ di sản và tour 3D. */
export function heritageStyle(look: MapLook = 'street'): StyleSpecification {
  const street = look === 'street';
  return {
    version: 8,
    projection: { type: 'globe' },
    glyphs: OFM_GLYPHS,
    light: { anchor: 'viewport', color: '#ffffff', intensity: 0.32, position: [1.3, 210, 35] },
    sky: street
      ? { 'sky-color': '#cfe3ee', 'horizon-color': '#f3efe6', 'fog-color': '#f3f1ec', 'sky-horizon-blend': 0.5, 'horizon-fog-blend': 0.6, 'fog-ground-blend': 0.85, 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 1, 12, 0] }
      : { 'sky-color': '#1b2633', 'horizon-color': '#d9c9a3', 'fog-color': '#e9dcc0', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.88, 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 1, 12, 0] },
    sources: {
      omt: { type: 'vector', url: OFM_TILES, attribution: '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> · Dữ liệu © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>' },
      ...(street ? {} : {
        satellite: {
          type: 'raster' as const, tiles: [SATELLITE], tileSize: 256, maxzoom: 18,
          attribution: 'Powered by <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a> · Ảnh vệ tinh: Esri, Maxar, Earthstar Geographics và cộng đồng GIS',
        },
      }),
      route: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      focus: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    },
    layers: [...(street ? streetLayers() : satelliteLayers()), ...labelLayers(look), ...overlayLayers(look)],
  };
}

/** Tô vàng khối nhà nằm ngay dưới mỗi điểm di sản (nếu dữ liệu OSM có khối nhà ở đó). */
export function markHeritageBuildings(map: import('maplibre-gl').Map, points: { lng: number; lat: number }[]) {
  if (!map.getLayer('building-3d')) return;
  for (const p of points) {
    const px = map.project([p.lng, p.lat]);
    const hits = map.queryRenderedFeatures([[px.x - 6, px.y - 6], [px.x + 6, px.y + 6]], { layers: ['building-3d'] });
    for (const f of hits) if (f.id !== undefined) map.setFeatureState({ source: 'omt', sourceLayer: 'building', id: f.id }, { heritage: true });
  }
}

/** Làm mềm đường gấp khúc (thuật toán Chaikin), giữ nguyên hai đầu. */
export function smoothLine(points: [number, number][], rounds = 2): [number, number][] {
  let pts = points;
  for (let r = 0; r < rounds; r++) {
    if (pts.length < 3) return pts;
    const out: [number, number][] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}

/** Đặc trưng GeoJSON cho các chặng của một tour; chặng có đường dò thật được làm mềm và đánh dấu `traced`. */
export function legFeatures(legs: { coords: [number, number][]; traced: boolean }[], offset = 0) {
  return legs.map((l, k) => ({
    type: 'Feature' as const,
    properties: { i: k + offset, traced: l.traced },
    geometry: { type: 'LineString' as const, coordinates: l.traced ? smoothLine(l.coords) : l.coords },
  }));
}
