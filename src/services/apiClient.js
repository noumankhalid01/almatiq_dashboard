import { getAccessToken, refreshAccessToken } from '../utils/tokenUtils.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const IS_NGROK_BASE_URL = /ngrok/i.test(API_BASE_URL);
const getNgrokBypassHeaders = () =>
  IS_NGROK_BASE_URL ? { 'ngrok-skip-browser-warning': 'true' } : {};

const toErrorMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload.detail === 'string') return payload.detail;
  if (typeof payload.message === 'string') return payload.message;
  if (Array.isArray(payload.errors) && payload.errors.length) {
    return payload.errors.join(', ');
  }
  return fallback;
};

export const apiPost = async (path, body, { auth = false } = {}) => {
  if (!API_BASE_URL) {
    throw new Error('Missing VITE_API_BASE_URL in your .env file.');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...getNgrokBypassHeaders()
  };

  if (auth) {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Missing access token. Please log in again.');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const call = async (tokenOverride = '') => {
    const requestHeaders = { ...headers };
    if (auth && tokenOverride) {
      requestHeaders.Authorization = `Bearer ${tokenOverride}`;
    }
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => null);
    return { response, payload };
  };

  let { response, payload } = await call();

  if (auth && isInvalidTokenError(response, payload)) {
    const freshAccessToken = await refreshAccessToken();
    ({ response, payload } = await call(freshAccessToken));
  }

  if (!response.ok) {
    const error = new Error(toErrorMessage(payload, 'Something went wrong. Please try again.'));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const apiPatch = async (path, body, { auth = false } = {}) => {
  if (!API_BASE_URL) {
    throw new Error('Missing VITE_API_BASE_URL in your .env file.');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...getNgrokBypassHeaders()
  };

  if (auth) {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Missing access token. Please log in again.');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const call = async (tokenOverride = '') => {
    const requestHeaders = { ...headers };
    if (auth && tokenOverride) {
      requestHeaders.Authorization = `Bearer ${tokenOverride}`;
    }
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: requestHeaders,
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => null);
    return { response, payload };
  };

  let { response, payload } = await call();

  if (auth && isInvalidTokenError(response, payload)) {
    const freshAccessToken = await refreshAccessToken();
    ({ response, payload } = await call(freshAccessToken));
  }

  if (!response.ok) {
    const error = new Error(toErrorMessage(payload, 'Something went wrong. Please try again.'));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

const isInvalidTokenError = (response, payload) =>
  response.status === 401 &&
  typeof payload?.detail === 'string' &&
  payload.detail.toLowerCase() === 'invalid token';

export const apiGet = async (path, { auth = false } = {}) => {
  if (!API_BASE_URL) {
    throw new Error('Missing VITE_API_BASE_URL in your .env file.');
  }

  const headers = {};
  Object.assign(headers, getNgrokBypassHeaders());
  if (auth) {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Missing access token. Please log in again.');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const call = async (tokenOverride = '') => {
    const requestHeaders = { ...headers };
    if (auth && tokenOverride) {
      requestHeaders.Authorization = `Bearer ${tokenOverride}`;
    }
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: requestHeaders
    });
    const payload = await response.json().catch(() => null);
    return { response, payload };
  };

  let { response, payload } = await call();

  if (auth && isInvalidTokenError(response, payload)) {
    const freshAccessToken = await refreshAccessToken();
    ({ response, payload } = await call(freshAccessToken));
  }

  if (!response.ok) {
    const error = new Error(toErrorMessage(payload, 'Something went wrong. Please try again.'));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};
