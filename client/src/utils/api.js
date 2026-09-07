const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = `${API_ORIGIN}/api`;
const GET_CACHE_TTL = 15000;
const getCache = new Map();
const inFlight = new Map();

export async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('tadka_token');

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const cacheKey = `${method}:${endpoint}:${token || 'anonymous'}`;
  if (method === 'GET') {
    const cached = getCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < GET_CACHE_TTL) return cached.data;
    if (inFlight.has(cacheKey)) return inFlight.get(cacheKey);
  }

  const request = fetch(`${API_BASE}${endpoint}`, options)
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Server request failed');
      if (method === 'GET') getCache.set(cacheKey, { createdAt: Date.now(), data });
      else invalidateCache(endpoint);
      return data;
    })
    .catch(err => {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    })
    .finally(() => inFlight.delete(cacheKey));

  if (method === 'GET') inFlight.set(cacheKey, request);
  return request;
}

function invalidateCache(endpoint) {
  const related = endpoint.split('/')[1];
  for (const key of getCache.keys()) {
    if (key.includes(`:${related}`)) getCache.delete(key);
  }
}
