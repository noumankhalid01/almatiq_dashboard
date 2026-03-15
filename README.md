# Almatiq Dashboard

A modern React + Vite + TailwindCSS dashboard powered by live Google Sheets data.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create an `.env` file at the project root:

```bash
VITE_GOOGLE_SHEETS_ID=your_google_sheet_id
# Optional: use the Sheets API instead of public CSV export
VITE_GOOGLE_SHEETS_API_KEY=your_google_api_key
# Optional: override sheet names
VITE_GOOGLE_SHEETS_BOOKINGS_SHEET=Bookings
VITE_GOOGLE_SHEETS_LEADS_SHEET=Leads
```

3. Run the app:

```bash
npm run dev
```

## Google Sheets Notes

- If you do **not** provide an API key, the app reads data via the public CSV export endpoint. Make sure the Google Sheet is shared publicly or published to the web.
- If you **do** provide an API key, the sheet can remain unlisted as long as it is readable by the API key and the Google Sheets API is enabled for your project.

## Project Structure

```
src/
  components/
  hooks/
  pages/
  services/
  utils/
```

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
