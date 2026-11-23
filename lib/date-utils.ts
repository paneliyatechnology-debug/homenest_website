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
    return `${day}-${month}-${year}`;
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
    return `${day}-${month}-${year}${time}`;
  }

  // YYYY-MM-DD or YYYY/MM/DD with optional time
  const yyyymmddMatch = clean.match(/^(\d{4})[-/](\d{2})[-/](\d{2})(?:[T\s](\d{1,2}):(\d{2}))?/);
  if (yyyymmddMatch) {
    const year = yyyymmddMatch[1];
    const month = yyyymmddMatch[2];
    const day = yyyymmddMatch[3];
    const time = yyyymmddMatch[4] && yyyymmddMatch[5] ? ` ${yyyymmddMatch[4]}:${yyyymmddMatch[5]}` : '';
    return `${day}-${month}-${year}${time}`;
  }

  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return clean;
}

/**
 * Formats any date string or Date object to DD-MM-YYYY, hh:mm A with time if available,
 * or DD-MM-YYYY if no time component exists.
 */
export function formatDateTimeToDDMMYYYY(
  dateInput?: string | Date | null,
  timeInput?: string | null
): string {
  if (!dateInput && !timeInput) return '—';

  let str = (
    dateInput instanceof Date
      ? dateInput.toISOString()
      : dateInput
      ? String(dateInput)
      : ''
  ).trim();

  if (str === '-' || str === '—' || !str) {
    if (!timeInput) return '—';
    str = '';
  }

  // Replace bullet points or separator characters
  str = str.replace(/•/g, ' ').trim();

  // If timeInput is provided separately and not already in str
  if (timeInput && !str.includes(':')) {
    str = `${str} ${timeInput.trim()}`.trim();
  }

  // Check if string has explicit time part with AM/PM (e.g. "23 Nov 2026, 04:09 PM" or "23-11-2026 04:09 PM")
  const ampmMatch = str.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/i);
  let timeStr = '';
  if (ampmMatch) {
    const hh = ampmMatch[1].padStart(2, '0');
    const mm = ampmMatch[2];
    const ampm = ampmMatch[3].toUpperCase();
    timeStr = `${hh}:${mm} ${ampm}`;
  } else {
    // Check for 24-hour time e.g. 16:09 or 16:09:00 (avoid matching timezone Z)
    const time24Match = str.match(/(?:[T\s,]|^)(\d{1,2}):(\d{2})(?::\d{2})?(?:\s|$)/);
    if (time24Match && !str.includes('Z')) {
      let hours = parseInt(time24Match[1], 10);
      const mm = time24Match[2];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      timeStr = `${String(hours).padStart(2, '0')}:${mm} ${ampm}`;
    }
  }

  // Check if starts with DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return timeStr ? `${day}-${month}-${year}, ${timeStr}` : `${day}-${month}-${year}`;
  }

  // Try Date parsing (for ISO strings, standard formats like '23 Nov 2026, 04:09 PM', etc.)
  const d = new Date(str.includes(',') && !str.match(/[a-zA-Z]/) ? str.replace(',', '') : str);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    if (!timeStr) {
      const hasTime = str.includes('T') || str.match(/\d{1,2}:\d{2}/);
      if (hasTime) {
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
      }
    }
    return timeStr ? `${day}-${month}-${year}, ${timeStr}` : `${day}-${month}-${year}`;
  }

  return str;
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
