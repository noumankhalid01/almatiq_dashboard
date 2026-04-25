import { FRIENDLY_API_ERROR_MESSAGE, getFriendlyErrorMessage } from './errorMessages.js';
import { clearStoredAuth, getAuthSnapshot, setAuthSnapshot, writeStoredAuth } from '../context/AuthContext.jsx';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const isInvalidTokenDetail = (payload) =>
  typeof payload?.detail === 'string' && payload.detail.toLowerCase() === 'invalid token';
const IS_NGROK_BASE_URL = /ngrok/i.test(API_BASE_URL);

export const toBooleanFlag = (value) =>
  value === true || value === 'true' || value === 1 || value === '1';

export const getAccessToken = () => {
  const auth = getAuthSnapshot();
  return auth?.jwt_token?.access_token || auth?.access_token || auth?.token || auth?.jwt || '';
};

export const getRefreshToken = () => {
  const auth = getAuthSnapshot();
  return auth?.jwt_token?.refresh_token || '';
};

export const setAccessToken = (accessToken) => {
  const auth = getAuthSnapshot();
  if (!auth) return;

  const nextAuth = {
    ...auth,
    jwt_token: {
      ...(auth.jwt_token || {}),
      access_token: accessToken
    }
  };

  setAuthSnapshot(nextAuth);
  writeStoredAuth(nextAuth);
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
    clearStoredAuth();
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
