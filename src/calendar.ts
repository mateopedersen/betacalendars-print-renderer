export type Weekday = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export type GridMode = 'natural' | 'fixed-six-weeks';
export type Orientation = 'portrait' | 'landscape';
export type Paper = 'a4' | 'letter' | 'a5' | 'legal';

export const WEEKDAYS: Weekday[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function assertYearMonth(year: number, month: number): void {
  if (!Number.isInteger(year) || year < 1 || year > 9999) throw new RangeError('year must be an integer from 1 to 9999');
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('month must be an integer from 1 to 12');
}

export function isLeapYear(year: number): boolean {
  if (!Number.isInteger(year) || year < 1) throw new RangeError('year must be a positive integer');
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year: number, month: number): number {
  assertYearMonth(year, month);
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

// Proleptic Gregorian civil-day arithmetic. It deliberately avoids Date and time zones.
export function daysFromCivil(year: number, month: number, day: number): number {
  assertYearMonth(year, month);
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month)) throw new RangeError('day is outside the selected month');
  const y = year - (month <= 2 ? 1 : 0);
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = month + (month > 2 ? -3 : 9);
  const doy = Math.floor((153 * mp + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function weekdayIndex(year: number, month: number, day: number): number {
  return ((daysFromCivil(year, month, day) + 4) % 7 + 7) % 7; // Sunday=0; 1970-01-01 was Thursday.
}

export interface CalendarOptions {
  year: number;
  month: number;
  weekStart?: Weekday;
  grid?: GridMode;
}

export interface CalendarCell {
  row: number;
  column: number;
  day: number | null;
  date: string | null;
  inCurrentMonth: boolean;
}

export interface CalendarModel {
  year: number;
  month: number;
  monthName: string;
  daysInMonth: number;
  firstWeekday: number;
  lastWeekday: number;
  weekStart: Weekday;
  leadingCells: number;
  trailingCells: number;
  rowCount: number;
  fixedCellCount: number;
  grid: GridMode;
  topologySignature: string;
  weekdays: Weekday[];
  cells: CalendarCell[];
}

export function createCalendar(options: CalendarOptions): CalendarModel {
  const { year, month } = options;
  assertYearMonth(year, month);
  const weekStart = options.weekStart ?? 'sunday';
  const grid = options.grid ?? 'natural';
  const startIndex = WEEKDAYS.indexOf(weekStart);
  if (startIndex < 0) throw new RangeError(`unsupported week start: ${weekStart}`);
  if (!['natural', 'fixed-six-weeks'].includes(grid)) throw new RangeError(`unsupported grid mode: ${grid}`);
  const count = daysInMonth(year, month);
  const firstWeekday = weekdayIndex(year, month, 1);
  const lastWeekday = weekdayIndex(year, month, count);
  const leadingCells = (firstWeekday - startIndex + 7) % 7;
  const rowCount = grid === 'fixed-six-weeks' ? 6 : Math.ceil((leadingCells + count) / 7);
  const trailingCells = rowCount * 7 - leadingCells - count;
  const cells: CalendarCell[] = [];
  for (let position = 0; position < rowCount * 7; position++) {
    const day = position - leadingCells + 1;
    const inCurrentMonth = day >= 1 && day <= count;
    cells.push({
      row: Math.floor(position / 7), column: position % 7,
      day: inCurrentMonth ? day : null,
      date: inCurrentMonth ? `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null,
      inCurrentMonth,
    });
  }
  const weekdays = Array.from({ length: 7 }, (_, i) => WEEKDAYS[(startIndex + i) % 7]);
  const topologySignature = `${year}-${String(month).padStart(2, '0')}:w${startIndex}:d${count}:l${leadingCells}:r${rowCount}:t${trailingCells}`;
  return { year, month, monthName: MONTHS[month - 1], daysInMonth: count, firstWeekday, lastWeekday, weekStart, leadingCells, trailingCells, rowCount, fixedCellCount: rowCount * 7, grid, topologySignature, weekdays, cells };
}

export function monthReference(month: number): string {
  const slug = MONTHS[month - 1]?.toLowerCase();
  if (!slug) throw new RangeError('month must be an integer from 1 to 12');
  return `https://www.betacalendars.com/${slug}-calendar.html`;
}

export function monthRange(from: string, to: string): Array<{ year: number; month: number }> {
  const parse = (value: string) => {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (!match) throw new RangeError('range dates must use YYYY-MM');
    const year = Number(match[1]); const month = Number(match[2]); assertYearMonth(year, month);
    return (year - 1) * 12 + month - 1;
  };
  const start = parse(from); const end = parse(to);
  if (end < start) throw new RangeError('--to must not be earlier than --from');
  if (end - start > 119) throw new RangeError('a range may contain at most 120 months');
  return Array.from({ length: end - start + 1 }, (_, i) => ({ year: Math.floor((start + i) / 12) + 1, month: (start + i) % 12 + 1 }));
}
