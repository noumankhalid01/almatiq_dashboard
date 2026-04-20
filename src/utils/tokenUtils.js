const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const isInvalidTokenDetail = (payload) =>
  typeof payload?.detail === 'string' && payload.detail.toLowerCase() === 'invalid token';

const parseAuth = () => {
  try {
    const raw = localStorage.getItem('auth');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
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

  localStorage.setItem('auth', JSON.stringify(nextAuth));
};

export const refreshAccessToken = async () => {
  if (!API_BASE_URL) {
    throw new Error('Missing VITE_API_BASE_URL in your .env file.');
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('Missing refresh token. Please log in again.');
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  const payload = await response.json().catch(() => null);

  if (response.status === 401 && isInvalidTokenDetail(payload)) {
    localStorage.clear();
    sessionStorage.clear();
    if (typeof window !== 'undefined') {
      window.location.assign('/login?session_expired=1');
    }
    throw new Error('Session expired, please login again.');
  }

  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.detail || payload?.message || 'Unable to refresh access token.');
  }

  setAccessToken(payload.access_token);
  return payload.access_token;
};
