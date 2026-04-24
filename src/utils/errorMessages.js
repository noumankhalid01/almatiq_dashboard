export const FRIENDLY_API_ERROR_MESSAGE =
  'Oops! Something went wrong on our end. Please try again in a moment. If the problem keeps coming up, contact our support team.';

const TECHNICAL_MESSAGE_PATTERNS = [
  /^failed to fetch$/i,
  /^network error$/i,
  /^failed to load sheet:/i,
  /not found/i,
  /internal server error/i,
  /bad gateway/i,
  /service unavailable/i,
  /gateway timeout/i
];

export const getFriendlyErrorMessage = (value, fallback = FRIENDLY_API_ERROR_MESSAGE) => {
  const rawMessage =
    typeof value === 'string'
      ? value
      : value?.message || value?.detail || value?.statusText || value?.error || '';

  const message = rawMessage.trim();
  if (!message) return fallback;

  if (TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))) {
    return fallback;
  }

  return message;
};
