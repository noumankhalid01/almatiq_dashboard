import { FRIENDLY_API_ERROR_MESSAGE, getFriendlyErrorMessage } from './errorMessages.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const isInvalidTokenDetail = (payload) =>
  typeof payload?.detail === 'string' && payload.detail.toLowerCase() === 'invalid token';
const IS_NGROK_BASE_URL = /ngrok/i.test(API_BASE_URL);

export const parseAuth = () => {
  try {
    const raw = localStorage.getItem('auth');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveAuth = (nextAuth) => {
  if (!nextAuth) return;
  localStorage.setItem('auth', JSON.stringify(nextAuth));
};

export const getAccessToken = () => {
  const auth = parseAuth();
  return auth?.jwt_token?.access_token || auth?.access_token || auth?.token || auth?.jwt || '';
};

export const getRefreshToken = () => {
  const auth = parseAuth();
  return auth?.jwt_token?.refresh_token || '';
};

export const setAccessToken = (accessToken) => {
  const auth = parseAuth();
  if (!auth) return;

  const nextAuth = {
    ...auth,
    jwt_token: {
      ...(auth.jwt_token || {}),
      access_token: accessToken
    }
  };

  saveAuth(nextAuth);
};

export const refreshAccessToken = async () => {
  if (!API_BASE_URL) {
    throw new Error('Missing VITE_API_BASE_URL in your .env file.');
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('Missing refresh token. Please log in again.');
  }

  let response;
  let payload;
  try {
    response = await fetch(`${API_BASE_URL}/auth/refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(IS_NGROK_BASE_URL ? { 'ngrok-skip-browser-warning': 'true' } : {})
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    payload = await response.json().catch(() => null);
  } catch {
    throw new Error(FRIENDLY_API_ERROR_MESSAGE);
  }

  if (response.status === 401 && isInvalidTokenDetail(payload)) {
    localStorage.clear();
    sessionStorage.clear();
    if (typeof window !== 'undefined') {
      window.location.assign('/login?session_expired=1');
    }
    throw new Error('Session expired, please login again.');
  }

  if (!response.ok || !payload?.access_token) {
    throw new Error(getFriendlyErrorMessage(payload, FRIENDLY_API_ERROR_MESSAGE));
  }

  setAccessToken(payload.access_token);
  return payload.access_token;
};
