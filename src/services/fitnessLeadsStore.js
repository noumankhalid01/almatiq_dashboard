import { apiGet } from './apiClient.js';

const cache = new Map();
const inFlight = new Map();
const listeners = new Set();

export const getFitnessLeadsCache = (key) => cache.get(key);

export const setFitnessLeadsCache = (key, value) => {
  cache.set(key, value);
  listeners.forEach((listener) => listener(key, value));
};

export const subscribeFitnessLeads = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const fetchFitnessLeads = async (key, { force = false } = {}) => {
  if (!force) {
    const cached = cache.get(key);
    if (cached) return cached;
    const pending = inFlight.get(key);
    if (pending) return pending;
  }

  const request = apiGet('/leads/fitness/data', { auth: true })
    .catch((err) => {
      if (err?.status === 404) return [];
      throw err;
    })
    .then((response) => {
      const data = Array.isArray(response) ? response : [];
      const value = { data, lastUpdated: new Date().toISOString() };
      setFitnessLeadsCache(key, value);
      return value;
    });

  inFlight.set(key, request);
  try {
    return await request;
  } finally {
    inFlight.delete(key);
  }
};
