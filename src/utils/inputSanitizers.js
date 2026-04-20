const stripTags = (value) => value.replace(/[<>]/g, '');

export const sanitizeText = (value) => stripTags(value).replace(/\s+/g, ' ').trimStart();

export const sanitizeEmail = (value) => sanitizeText(value).toLowerCase();

export const sanitizePhone = (value) => stripTags(value).replace(/[^\d+\-\s()]/g, '').trimStart();

export const toTitleCaseLive = (value) =>
  sanitizeText(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const toTitleCasePreserveAcronyms = (value) => {
  const cleaned = sanitizeText(value);

  return cleaned
    .split(/\s+/)
    .map((token) => {
      const match = token.match(/^([^A-Za-z0-9]*)([A-Za-z0-9'.-]+)([^A-Za-z0-9]*)$/);
      if (!match) return token;

      const [, prefix, core, suffix] = match;

      // Keep short alphabetic tokens uppercase for addresses (e.g., NC, USA, PK).
      if (/^[A-Za-z]{2,5}$/.test(core)) {
        return `${prefix}${core.toUpperCase()}${suffix}`;
      }

      // Keep number-led segments readable (e.g., 3rd, 24B).
      if (/^\d+[A-Za-z]{0,3}$/.test(core)) {
        return `${prefix}${core}${suffix}`;
      }

      const titled = core
        .toLowerCase()
        .replace(/(^[a-z])|([-'’][a-z])/g, (part) => part.toUpperCase());

      return `${prefix}${titled}${suffix}`;
    })
    .join(' ');
};
