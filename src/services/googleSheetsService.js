import { parseCsv } from '../utils/csv.js';

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

export const SHEET_NAMES = {
  bookings: import.meta.env.VITE_GOOGLE_SHEETS_BOOKINGS_SHEET || 'Bookings',
  leads: import.meta.env.VITE_GOOGLE_SHEETS_LEADS_SHEET || 'Leads'
};

const buildApiUrl = (sheetName) =>
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`;

const buildCsvUrl = (sheetName) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

const normalizeHeader = (header) =>
  header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const normalizeHeaders = (headers) => headers.map(normalizeHeader);

const mapRowsToObjects = (headers, rows) => {
  return rows
    .filter((row) => row.some((cell) => (cell ?? '').toString().trim() !== ''))
    .map((row) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = row[index] ?? '';
      });
      return entry;
    });
};

export const fetchSheetData = async (sheetName) => {
  if (!SHEET_ID) {
    throw new Error('Missing Google Sheets ID. Add VITE_GOOGLE_SHEETS_ID to your .env file.');
  }

  const url = API_KEY ? buildApiUrl(sheetName) : buildCsvUrl(sheetName);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load sheet: ${response.status} ${response.statusText}`);
  }

  if (API_KEY) {
    const payload = await response.json();
    if (!payload.values || payload.values.length === 0) {
      return [];
    }
    const [rawHeaders, ...rows] = payload.values;
    const headers = normalizeHeaders(rawHeaders);
    return mapRowsToObjects(headers, rows);
  }

  const csvText = await response.text();
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return [];
  }
  const [rawHeaders, ...dataRows] = rows;
  const headers = normalizeHeaders(rawHeaders);
  return mapRowsToObjects(headers, dataRows);
};
