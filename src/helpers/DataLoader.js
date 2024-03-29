export class DataLoader {
  constructor(geoIds, exclude_meshes = 1, depth = 0, limit = 0) {
    this.baseUrl = import.meta.env.VITE_APP_RUST_SERVICE_URL
    this.url = `${this.baseUrl}?geo_ids=${geoIds}`
    if (exclude_meshes) {
      this.url += `&exclude_meshes=${exclude_meshes}`
    }
    if (depth) {
      this.url += `&depth=${depth}`
    }
    if (limit) {
      this.url += `&limit=${limit}`
    }
  }

  async loadData() {
    // Fetch data from the specified URL.
    const response = await fetch(this.url)
    // Parse the response as JSON data.
    const data = await response.json()
    return data
  }
}
