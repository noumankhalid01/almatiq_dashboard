import { useCallback, useEffect, useState } from 'react';
import { fetchSheetData } from '../services/googleSheetsService.js';
import { FRIENDLY_API_ERROR_MESSAGE, getFriendlyErrorMessage } from '../utils/errorMessages.js';

const sheetCache = new Map();
const sheetInFlight = new Map();

const useSheetData = (sheetName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async ({ force = false } = {}) => {
    if (!sheetName) {
      setData([]);
      setLoading(false);
      setError('Missing sheet name.');
      return;
    }

    if (!force) {
      const cached = sheetCache.get(sheetName);
      if (cached) {
        setData(cached.data);
        setLastUpdated(cached.lastUpdated);
        setLoading(false);
        setError(null);
        return;
      }

      const inFlight = sheetInFlight.get(sheetName);
      if (inFlight) {
        setLoading(true);
        setError(null);
        try {
          const cachedResult = await inFlight;
          setData(cachedResult.data);
          setLastUpdated(cachedResult.lastUpdated);
        } catch (err) {
          setError(getFriendlyErrorMessage(err, FRIENDLY_API_ERROR_MESSAGE));
          setData([]);
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const fetchPromise = fetchSheetData(sheetName).then((rows) => {
        const nextValue = {
          data: Array.isArray(rows) ? rows : [],
          lastUpdated: new Date().toISOString()
        };
        sheetCache.set(sheetName, nextValue);
        return nextValue;
      });

      sheetInFlight.set(sheetName, fetchPromise);
      const result = await fetchPromise;
      setData(result.data);
      setLastUpdated(result.lastUpdated);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, FRIENDLY_API_ERROR_MESSAGE));
      setData([]);
    } finally {
      sheetInFlight.delete(sheetName);
      setLoading(false);
    }
  }, [sheetName]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, lastUpdated, refresh: () => load({ force: true }) };
};

export default useSheetData;
