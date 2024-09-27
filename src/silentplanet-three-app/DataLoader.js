// @TODO add caching
// @TODO add error handling
// @TODO add retries
export async function fetchDataWithAuth(endpoint, params = {}) {
  // @TODO get user id from auth and use jwt token in header
  const userId = 1;
  const url = createRequestUrl(endpoint, { user_id: userId, ...params });
  const response = await fetch(url);
  return response.json();
}

function createRequestUrl(baseUrl, params = {}) {
  const url = new URL(baseUrl);
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  }
  
  return url.toString();
}
