import { fetchDataWithAuth } from '../DataLoader';

export async function getGeoJsonData(geoIds, options = {}) {
  return fetchDataWithAuth(
    import.meta.env.VITE_APP_RUST_GEOS_SERVICE_URL,
    { geo_ids: geoIds, ...options }
  );
}