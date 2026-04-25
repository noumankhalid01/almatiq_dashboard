import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AUTH_STORAGE_KEY = 'auth';
let authSnapshot;

const safeParseAuth = (raw) => {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const readStoredAuth = () => {
  if (typeof sessionStorage === 'undefined') return null;
  const parsed = safeParseAuth(sessionStorage.getItem(AUTH_STORAGE_KEY));
  authSnapshot = parsed;
  return parsed;
};

export const writeStoredAuth = (nextAuth) => {
  if (typeof sessionStorage === 'undefined') return;
  if (!nextAuth) {
    clearStoredAuth();
    return;
  }

  authSnapshot = nextAuth;
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
};

export const clearStoredAuth = () => {
  authSnapshot = null;
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.clear();
};

export const getAuthSnapshot = () => {
  if (typeof authSnapshot === 'undefined') {
    return readStoredAuth();
  }
  return authSnapshot;
};

export const setAuthSnapshot = (nextAuth) => {
  authSnapshot = nextAuth;
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => readStoredAuth());
  const [logoutReason, setLogoutReason] = useState(null);

  useEffect(() => {
    setAuthSnapshot(auth);
  }, [auth]);

  const login = useCallback((data) => {
    if (!data) {
      clearStoredAuth();
      setAuth(null);
      setLogoutReason(null);
      return;
    }

    writeStoredAuth(data);
    setAuth(data);
    setLogoutReason(null);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setAuth(null);
    setLogoutReason('logout');
  }, []);

  const value = useMemo(
    () => ({
      auth,
      login,
      logout,
      logoutReason
    }),
    [auth, login, logout, logoutReason]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
};
