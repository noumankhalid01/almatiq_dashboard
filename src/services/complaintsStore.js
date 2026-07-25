import { apiGet } from './apiClient.js';

const cache = new Map();
const inFlight = new Map();
const listeners = new Set();

export const getComplaintsCache = (key) => cache.get(key);

export const setComplaintsCache = (key, value) => {
  cache.set(key, value);
  listeners.forEach((listener) => listener(key, value));
};

export const subscribeComplaints = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const fetchComplaints = async (key, { force = false } = {}) => {
  if (!force) {
    const cached = cache.get(key);
    if (cached) return cached;
    const pending = inFlight.get(key);
    if (pending) return pending;
  }

  const request = apiGet('/complaints/data', { auth: true })
    .catch((err) => {
      if (err?.status === 404) return [];
      throw err;
    })
    .then((response) => {
      const data = Array.isArray(response) ? response : [];
      const value = { data, lastUpdated: new Date().toISOString() };
      setComplaintsCache(key, value);
      return value;
    });

  inFlight.set(key, request);
  try {
    return await request;
  } finally {
    inFlight.delete(key);
  }
};
