import { Platform } from 'react-native';
import { getToken } from './secureStore';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getBaseUrl();

const request = async (endpoint, options = {}) => {
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  // Determine candidate URLs (try primary base URL, then fallback if android)
  const candidateUrls = [];
  if (endpoint.startsWith('http')) {
    candidateUrls.push(endpoint);
  } else {
    candidateUrls.push(`${API_BASE_URL}${endpoint}`);
    if (Platform.OS === 'android') {
      if (API_BASE_URL.includes('10.0.2.2')) {
        candidateUrls.push(`http://localhost:5000/api${endpoint}`);
      } else {
        candidateUrls.push(`http://10.0.2.2:5000/api${endpoint}`);
      }
    }
  }

  let lastError = null;

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      lastError = err;
      if (err.status) {
        // Backend answered with an actual HTTP error code (e.g. 400 or 401), re-throw immediately
        throw err;
      }
      // Otherwise, connection/network failure, try next candidate URL
    }
  }

  throw lastError || new Error('Network request failed. Please check backend connection.');
};

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
