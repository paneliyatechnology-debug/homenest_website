/**
 * HomeNest Core Date Utilities
 * Centralized date parsing, formatting, and conversion functions.
 */

/**
 * Parses date string in either YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, or ISO format into a Date object.
 */
export function parseDateString(str?: string | null): Date | null {
  if (!str || !str.trim()) return null;
  const clean = str.trim().split(' ')[0];
  const parts = clean.includes('/') ? clean.split('/') : clean.split('-');

  if (parts.length === 3) {
    // Format: YYYY-MM-DD or YYYY/MM/DD
    if (parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
    // Format: DD-MM-YYYY or DD/MM/YYYY
    if (parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a Date object to YYYY-MM-DD for backend API transport.
 */
export function formatDateForApi(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Converts any date representation (DD/MM/YYYY, ISO, Date) to YYYY-MM-DD for inputs and API payloads.
 */
export function toInputDate(val?: string | Date | null): string {
  if (!val) return '';
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? '' : formatDateForApi(val);
  }
  const str = String(val).trim();
  if (!str) return '';

  // Check if DD-MM-YYYY or DD/MM/YYYY
  const dmYMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmYMatch) {
    const [, d, m, y] = dmYMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Check if plain YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Fallback to Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

/**
 * Formats any date string or Date object to DD/MM/YYYY with optional time
 */
export function formatDateToDDMMYYYY(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '—';
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const clean = String(dateInput).trim();
  if (!clean) return '—';

  // DD-MM-YYYY or DD/MM/YYYY with optional time
  const ddmmyyyyMatch = clean.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (ddmmyyyyMatch) {
    const day = ddmmyyyyMatch[1];
    const month = ddmmyyyyMatch[2];
    const year = ddmmyyyyMatch[3];
    const time = ddmmyyyyMatch[4] && ddmmyyyyMatch[5] ? ` ${ddmmyyyyMatch[4]}:${ddmmyyyyMatch[5]}` : '';
    return `${day}/${month}/${year}${time}`;
  }

  // YYYY-MM-DD or YYYY/MM/DD with optional time
  const yyyymmddMatch = clean.match(/^(\d{4})[-/](\d{2})[-/](\d{2})(?:[T\s](\d{1,2}):(\d{2}))?/);
  if (yyyymmddMatch) {
    const year = yyyymmddMatch[1];
    const month = yyyymmddMatch[2];
    const day = yyyymmddMatch[3];
    const time = yyyymmddMatch[4] && yyyymmddMatch[5] ? ` ${yyyymmddMatch[4]}:${yyyymmddMatch[5]}` : '';
    return `${day}/${month}/${year}${time}`;
  }

  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return clean;
}

/**
 * Checks whether a given Date or date string is valid.
 */
export function isDateValid(dateInput?: string | Date | null): boolean {
  if (!dateInput) return false;
  if (dateInput instanceof Date) {
    return !isNaN(dateInput.getTime());
  }
  const d = new Date(dateInput);
  return !isNaN(d.getTime());
}
