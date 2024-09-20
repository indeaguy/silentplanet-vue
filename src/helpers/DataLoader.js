export class DataLoader {
  constructor() {
    this.geosEndpoint = import.meta.env.VITE_APP_RUST_GEOS_SERVICE_URL;
    this.configEndpoint = import.meta.env.VITE_APP_CONFIG_SERVICE_URL;

  }

  createRequestUrl(baseUrl, params = {}) {
    const url = new URL(baseUrl);
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    }
    
    return url.toString();
  }

  async fetchDataWithAuth(endpoint, params = {}) {
    // @TODO get user id from auth and use jwt token in header
    const userId = 1;
    const url = this.createRequestUrl(endpoint, { user_id: userId, ...params });
    const response = await fetch(url);
    return response.json();
  }

  async getGeoJsonData(geoIds, options = {}) {
    return this.fetchDataWithAuth(this.geosEndpoint, { geo_ids: geoIds, ...options });
  }

  async getConfigData() {
    return this.fetchDataWithAuth(this.configEndpoint);
  }
}
