import type { Orientation, Paper } from './calendar.ts';

const PAPER_MM: Record<Paper, [number, number]> = {
  a4: [210, 297],
  letter: [215.9, 279.4],
  a5: [148, 210],
  legal: [215.9, 355.6],
};

export interface LayoutOptions {
  paper?: Paper;
  orientation?: Orientation;
  margin?: number;
  headerHeight?: number;
  weekdayHeaderHeight?: number;
  notesHeight?: number;
  rows?: number;
  columns?: number;
}

export interface PrintLayout {
  paper: Paper;
  orientation: Orientation;
  pageWidthMm: number;
  pageHeightMm: number;
  marginMm: number;
  printableWidthMm: number;
  printableHeightMm: number;
  headerHeightMm: number;
  weekdayHeaderHeightMm: number;
  notesHeightMm: number;
  gridWidthMm: number;
  gridHeightMm: number;
  columns: number;
  rows: number;
  cellWidthMm: number;
  cellHeightMm: number;
  cellAreaMm2: number;
}

export function printLayout(options: LayoutOptions = {}): PrintLayout {
  const paper = options.paper ?? 'a4';
  const orientation = options.orientation ?? 'portrait';
  if (!(paper in PAPER_MM)) throw new RangeError(`unsupported paper: ${paper}`);
  if (!['portrait', 'landscape'].includes(orientation)) throw new RangeError(`unsupported orientation: ${orientation}`);
  const raw = PAPER_MM[paper];
  const [pageWidthMm, pageHeightMm] = orientation === 'portrait' ? raw : [raw[1], raw[0]];
  const marginMm = options.margin ?? 10;
  const headerHeightMm = options.headerHeight ?? 15;
  const weekdayHeaderHeightMm = options.weekdayHeaderHeight ?? 8;
  const notesHeightMm = options.notesHeight ?? 20;
  const rows = options.rows ?? 6;
  const columns = options.columns ?? 7;
  for (const [name, value] of Object.entries({ margin: marginMm, headerHeight: headerHeightMm, weekdayHeaderHeight: weekdayHeaderHeightMm, notesHeight: notesHeightMm })) {
    if (!Number.isFinite(value) || value < 0 || value > 1000) throw new RangeError(`${name} must be between 0 and 1000 mm`);
  }
  if (!Number.isInteger(rows) || rows < 1 || rows > 20) throw new RangeError('rows must be an integer from 1 to 20');
  if (!Number.isInteger(columns) || columns < 1 || columns > 14) throw new RangeError('columns must be an integer from 1 to 14');
  const printableWidthMm = pageWidthMm - 2 * marginMm;
  const printableHeightMm = pageHeightMm - 2 * marginMm;
  const gridWidthMm = printableWidthMm;
  const gridHeightMm = printableHeightMm - headerHeightMm - weekdayHeaderHeightMm - notesHeightMm;
  if (gridWidthMm <= 0 || gridHeightMm <= 0) throw new RangeError('margins and reserved areas leave no printable calendar grid');
  const cellWidthMm = gridWidthMm / columns;
  const cellHeightMm = gridHeightMm / rows;
  return { paper, orientation, pageWidthMm, pageHeightMm, marginMm, printableWidthMm, printableHeightMm, headerHeightMm, weekdayHeaderHeightMm, notesHeightMm, gridWidthMm, gridHeightMm, columns, rows, cellWidthMm, cellHeightMm, cellAreaMm2: cellWidthMm * cellHeightMm };
}
