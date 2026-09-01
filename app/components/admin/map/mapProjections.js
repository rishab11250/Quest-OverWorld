export const TILE_PROVIDERS = {
  street: {
    name: 'Street',
    url: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`,
  },
  topo: {
    name: 'Topo',
    url: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`,
  },
  satellite: {
    name: 'Satellite',
    url: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  },
};

export const DEFAULT_CENTER = {
  latitude: 21.1796,
  longitude: 72.8662,
};

export const latLonToWorldPixels = (lat, lon, zoom) => {
  const n = Math.pow(2, zoom);
  const worldX = ((lon + 180) / 360) * 256 * n;
  const latRad = (lat * Math.PI) / 180;
  const worldY = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * 256 * n;
  return { worldX, worldY };
};

export const worldPixelsToLatLon = (worldX, worldY, zoom) => {
  const n = Math.pow(2, zoom);
  const lon = (worldX / (256 * n)) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * worldY) / (256 * n))));
  const lat = (latRad * 180) / Math.PI;
  return {
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lon.toFixed(6)),
  };
};

export const CAMPUS_LANDMARKS = [
  { name: 'North Quad', latitude: 21.1798, longitude: 72.8665, icon: 'fountain' },
  { name: 'Clocktower', latitude: 21.1804, longitude: 72.8672, icon: 'clock-outline' },
  { name: 'Library Arch', latitude: 21.1791, longitude: 72.8658, icon: 'book-open-variant' },
  { name: 'Innovation Hub', latitude: 21.1785, longitude: 72.8678, icon: 'lightbulb-on-outline' },
  { name: 'Amphitheatre', latitude: 21.181, longitude: 72.8655, icon: 'theater' },
];
