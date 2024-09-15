export class DataLoader {
  constructor() {
    this.baseUrl = import.meta.env.VITE_APP_RUST_GEOS_SERVICE_URL;
  }

  setGetGeoJsonUrlParameters(geoIds, options = {}) {
    const { exclude_meshes = 1, depth = 0, limit = 0 } = options;
    this.url = new URL(this.baseUrl);
    
    this.url.searchParams.append('geo_ids', geoIds);
    if (exclude_meshes) this.url.searchParams.append('exclude_meshes', exclude_meshes);
    if (depth) this.url.searchParams.append('depth', depth);
    if (limit) this.url.searchParams.append('limit', limit);
  }

  async getGeoJsonData(geoIds, options = {}) {
    this.setGetGeoJsonUrlParameters(geoIds, options);
    const response = await fetch(this.url);
    return response.json();
  }
}
