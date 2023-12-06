export class DataLoader {
  constructor(url) {
    this.url = url;
  }

  async loadData() {
    // Fetch data from the specified URL.
    const response = await fetch(this.url);
    // Parse the response as JSON data.
    const data = await response.json();
    return data;
  }

}
