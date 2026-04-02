export type HolidayCalendarId = 'none' | 'us-federal' | 'uk-england-wales';

export interface HolidayCalendar {
  id: HolidayCalendarId;
  label: string;
}

export const HOLIDAY_CALENDARS: HolidayCalendar[] = [
  { id: 'none', label: 'None (weekdays only)' },
  { id: 'us-federal', label: 'US Federal' },
  { id: 'uk-england-wales', label: 'UK (England & Wales)' },
];

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Day of week (0 = Sun … 6 = Sat) for a UTC calendar date. */
function utcDow(y: number, m: number, d: number): number {
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** n-th occurrence of `weekday` (0 = Sun … 6 = Sat) in a month. */
function nthWeekdayOfMonth(y: number, m: number, weekday: number, n: number): number {
  const firstDow = utcDow(y, m, 1);
  let d = 1 + ((weekday - firstDow + 7) % 7);
  d += (n - 1) * 7;
  return d;
}

/** Last occurrence of `weekday` in a month. */
function lastWeekdayOfMonth(y: number, m: number, weekday: number): number {
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lastDow = utcDow(y, m, daysInMonth);
  return daysInMonth - ((lastDow - weekday + 7) % 7);
}

/** Saturday → Friday, Sunday → Monday, otherwise unchanged. */
function observed(y: number, m: number, d: number): string {
  const wd = utcDow(y, m, d);
  if (wd === 6) return isoDate(y, m, d - 1);
  if (wd === 0) return isoDate(y, m, d + 1);
  return isoDate(y, m, d);
}

/** Easter Sunday (Anonymous Gregorian algorithm). */
function easter(y: number): { m: number; d: number } {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const dd = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - dd - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const n = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * n + 114) / 31);
  const day = ((h + l - 7 * n + 114) % 31) + 1;
  return { m: month, d: day };
}

function usFederalHolidays(y: number): string[] {
  return [
    observed(y, 1, 1),                                           // New Year's Day
    isoDate(y, 1, nthWeekdayOfMonth(y, 1, 1, 3)),               // MLK Day
    isoDate(y, 2, nthWeekdayOfMonth(y, 2, 1, 3)),               // Presidents' Day
    isoDate(y, 5, lastWeekdayOfMonth(y, 5, 1)),                  // Memorial Day
    ...(y >= 2021 ? [observed(y, 6, 19)] : []),                  // Juneteenth (from 2021)
    observed(y, 7, 4),                                           // Independence Day
    isoDate(y, 9, nthWeekdayOfMonth(y, 9, 1, 1)),               // Labor Day
    isoDate(y, 10, nthWeekdayOfMonth(y, 10, 1, 2)),             // Columbus Day
    observed(y, 11, 11),                                         // Veterans Day
    isoDate(y, 11, nthWeekdayOfMonth(y, 11, 4, 4)),             // Thanksgiving
    observed(y, 12, 25),                                         // Christmas
  ];
}

function ukEnglandWalesHolidays(y: number): string[] {
  const { m: em, d: ed } = easter(y);
  const easterMs = Date.UTC(y, em - 1, ed);
  const gf = new Date(easterMs - 2 * 86400000);
  const easterMon = new Date(easterMs + 86400000);

  // Christmas + Boxing Day substitution rules
  const christmasDow = utcDow(y, 12, 25);
  let christmasHols: string[];
  if (christmasDow === 5) {
    // Fri + Sat: Christmas stays Fri 25, Boxing observed Mon 28
    christmasHols = [isoDate(y, 12, 25), isoDate(y, 12, 28)];
  } else if (christmasDow === 6) {
    // Sat + Sun: Christmas observed Mon 27, Boxing observed Tue 28
    christmasHols = [isoDate(y, 12, 27), isoDate(y, 12, 28)];
  } else if (christmasDow === 0) {
    // Sun + Mon: Christmas observed Mon 26, Boxing observed Tue 27
    christmasHols = [isoDate(y, 12, 26), isoDate(y, 12, 27)];
  } else {
    christmasHols = [isoDate(y, 12, 25), isoDate(y, 12, 26)];
  }

  return [
    observed(y, 1, 1),                                                                     // New Year's Day
    isoDate(gf.getUTCFullYear(), gf.getUTCMonth() + 1, gf.getUTCDate()),                  // Good Friday
    isoDate(easterMon.getUTCFullYear(), easterMon.getUTCMonth() + 1, easterMon.getUTCDate()), // Easter Monday
    isoDate(y, 5, nthWeekdayOfMonth(y, 5, 1, 1)),                                         // Early May BH
    isoDate(y, 5, lastWeekdayOfMonth(y, 5, 1)),                                            // Spring BH
    isoDate(y, 8, lastWeekdayOfMonth(y, 8, 1)),                                            // Summer BH
    ...christmasHols,                                                                       // Christmas + Boxing Day
  ];
}

/**
 * Returns a Set of YYYY-MM-DD strings for the given calendar across the given year range.
 * Returns an empty Set for `'none'`.
 *
 * Note: UK exceptional substitutions (e.g. Jubilee 2022, VE Day 2020) are not included;
 * use the custom dates field for those.
 */
export function getHolidaySet(
  calendarId: HolidayCalendarId,
  startYear: number,
  endYear: number,
): Set<string> {
  const dates = new Set<string>();
  for (let y = startYear; y <= endYear; y++) {
    if (calendarId === 'us-federal') {
      for (const d of usFederalHolidays(y)) dates.add(d);
    } else if (calendarId === 'uk-england-wales') {
      for (const d of ukEnglandWalesHolidays(y)) dates.add(d);
    }
  }
  return dates;
}
