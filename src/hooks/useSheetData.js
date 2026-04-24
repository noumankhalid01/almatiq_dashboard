import { useCallback, useEffect, useState } from 'react';
import { fetchSheetData } from '../services/googleSheetsService.js';
import { FRIENDLY_API_ERROR_MESSAGE, getFriendlyErrorMessage } from '../utils/errorMessages.js';

const useSheetData = (sheetName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!sheetName) {
      setData([]);
      setLoading(false);
      setError('Missing sheet name.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await fetchSheetData(sheetName);
      setData(rows);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, FRIENDLY_API_ERROR_MESSAGE));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [sheetName]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
};

export default useSheetData;
