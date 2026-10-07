import { createCalendar, monthReference, type CalendarModel, type GridMode, type Weekday } from './calendar.ts';
import { printLayout, type LayoutOptions, type PrintLayout } from './geometry.ts';

const MM = 3.7795275591;
const esc = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export interface MonthRenderOptions extends LayoutOptions {
  year: number; month: number; weekStart?: Weekday; grid?: GridMode;
}

export function renderMonthSvg(options: MonthRenderOptions): string {
  const calendar = createCalendar(options);
  const layout = printLayout({ ...options, rows: calendar.rowCount });
  const width = layout.pageWidthMm * MM; const height = layout.pageHeightMm * MM;
  const x0 = layout.marginMm * MM; const y0 = layout.marginMm * MM;
  const gridY = y0 + (layout.headerHeightMm + layout.weekdayHeaderHeightMm) * MM;
  const gridW = layout.gridWidthMm * MM; const gridH = layout.gridHeightMm * MM;
  const cw = gridW / 7; const ch = gridH / calendar.rowCount;
  const lines: string[] = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${layout.pageWidthMm}mm" height="${layout.pageHeightMm}mm" viewBox="0 0 ${width.toFixed(3)} ${height.toFixed(3)}" role="img" aria-labelledby="title desc">`);
  lines.push(`<title id="title">${esc(calendar.monthName)} ${calendar.year} calendar</title>`);
  lines.push(`<desc id="desc">${calendar.monthName} ${calendar.year}, ${calendar.weekStart}-first, ${calendar.grid} grid on ${layout.paper.toUpperCase()} ${layout.orientation} paper.</desc>`);
  lines.push('<rect width="100%" height="100%" fill="#ffffff"/>');
  lines.push(`<text x="${x0.toFixed(3)}" y="${(y0 + 10 * MM).toFixed(3)}" font-family="Arial,sans-serif" font-size="${(7 * MM).toFixed(3)}" font-weight="700" fill="#172554">${esc(calendar.monthName)} ${calendar.year}</text>`);
  const labelY = y0 + layout.headerHeightMm * MM + 5.5 * MM;
  calendar.weekdays.forEach((day, i) => lines.push(`<text x="${(x0 + i * cw + cw / 2).toFixed(3)}" y="${labelY.toFixed(3)}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${(3.1 * MM).toFixed(3)}" font-weight="600" fill="#475569">${day.slice(0, 3).toUpperCase()}</text>`));
  lines.push(`<rect x="${x0.toFixed(3)}" y="${gridY.toFixed(3)}" width="${gridW.toFixed(3)}" height="${gridH.toFixed(3)}" fill="none" stroke="#334155" stroke-width="0.8"/>`);
  for (let col = 1; col < 7; col++) lines.push(`<path d="M ${(x0 + col * cw).toFixed(3)} ${gridY.toFixed(3)} V ${(gridY + gridH).toFixed(3)}" stroke="#94a3b8" stroke-width="0.45"/>`);
  for (let row = 1; row < calendar.rowCount; row++) lines.push(`<path d="M ${x0.toFixed(3)} ${(gridY + row * ch).toFixed(3)} H ${(x0 + gridW).toFixed(3)}" stroke="#94a3b8" stroke-width="0.45"/>`);
  for (const cell of calendar.cells) if (cell.day !== null) {
    lines.push(`<text x="${(x0 + cell.column * cw + 2.2 * MM).toFixed(3)}" y="${(gridY + cell.row * ch + 5.3 * MM).toFixed(3)}" font-family="Arial,sans-serif" font-size="${(3.5 * MM).toFixed(3)}" fill="#0f172a">${cell.day}</text>`);
  }
  const footerY = y0 + layout.headerHeightMm * MM + layout.weekdayHeaderHeightMm * MM + gridH + 6 * MM;
  lines.push(`<text x="${x0.toFixed(3)}" y="${footerY.toFixed(3)}" font-family="Arial,sans-serif" font-size="${(2.6 * MM).toFixed(3)}" fill="#64748b">${calendar.grid} grid · ${calendar.weekStart}-first · ${layout.paper.toUpperCase()} ${layout.orientation}</text>`);
  lines.push('</svg>');
  return `${lines.join('\n')}\n`;
}

export function renderBlankSvg(options: LayoutOptions & { rows: number; columns: number }): string {
  const { rows, columns } = options;
  if (!Number.isInteger(rows) || rows < 1 || rows > 20 || !Number.isInteger(columns) || columns < 1 || columns > 14) throw new RangeError('blank grid rows must be 1–20 and columns 1–14');
  const layout = printLayout({ ...options, rows, columns });
  const width = layout.pageWidthMm * MM; const height = layout.pageHeightMm * MM;
  const x = layout.marginMm * MM; const y = (layout.marginMm + layout.headerHeightMm + layout.weekdayHeaderHeightMm) * MM;
  const w = layout.gridWidthMm * MM; const h = layout.gridHeightMm * MM;
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${layout.pageWidthMm}mm" height="${layout.pageHeightMm}mm" viewBox="0 0 ${width.toFixed(3)} ${height.toFixed(3)}" role="img" aria-labelledby="title">`, `<title id="title">Blank ${rows} by ${columns} calendar grid</title>`, '<rect width="100%" height="100%" fill="#fff"/>', `<text x="${x.toFixed(3)}" y="${(layout.marginMm * MM + 10 * MM).toFixed(3)}" font-family="Arial,sans-serif" font-size="${(7 * MM).toFixed(3)}" font-weight="700" fill="#172554">Blank calendar grid</text>`, `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${w.toFixed(3)}" height="${h.toFixed(3)}" fill="none" stroke="#334155" stroke-width="0.8"/>`];
  for (let col = 1; col < columns; col++) parts.push(`<path d="M ${(x + w * col / columns).toFixed(3)} ${y.toFixed(3)} V ${(y + h).toFixed(3)}" stroke="#94a3b8" stroke-width="0.45"/>`);
  for (let row = 1; row < rows; row++) parts.push(`<path d="M ${x.toFixed(3)} ${(y + h * row / rows).toFixed(3)} H ${(x + w).toFixed(3)}" stroke="#94a3b8" stroke-width="0.45"/>`);
  return `${parts.concat('</svg>').join('\n')}\n`;
}

export function calendarJson(calendar: CalendarModel, layout: PrintLayout): object {
  return { calendar: { year: calendar.year, month: calendar.month, monthName: calendar.monthName, daysInMonth: calendar.daysInMonth, firstWeekday: calendar.firstWeekday, lastWeekday: calendar.lastWeekday }, grid: { mode: calendar.grid, weekStart: calendar.weekStart, leadingCells: calendar.leadingCells, trailingCells: calendar.trailingCells, rowCount: calendar.rowCount, fixedCellCount: calendar.fixedCellCount, topologySignature: calendar.topologySignature, weekdays: calendar.weekdays, cells: calendar.cells }, paper: { format: layout.paper, orientation: layout.orientation }, layout, references: { homepage: 'https://www.betacalendars.com/', month: monthReference(calendar.month) }, generator: { name: 'BetaCalendars Print Renderer', version: '1.0.0' } };
}

function pdfText(s: string): string { return s.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)').replace(/[^\x20-\x7E]/g, ''); }
function pdfContent(calendar: CalendarModel | null, layout: PrintLayout, blankRows?: number, blankColumns?: number): string {
  const pt = (mm: number) => mm * 72 / 25.4;
  const w = pt(layout.pageWidthMm); const h = pt(layout.pageHeightMm); const x = pt(layout.marginMm);
  const gridYmm = layout.marginMm + layout.headerHeightMm + layout.weekdayHeaderHeightMm;
  const gy = h - pt(gridYmm); const gw = pt(layout.gridWidthMm); const gh = pt(layout.gridHeightMm);
  const rows = calendar?.rowCount ?? blankRows!; const cols = calendar ? 7 : blankColumns!;
  const cw = gw / cols; const ch = gh / rows;
  const ops = ['0.2 0.28 0.38 RG 0.55 w', `${x.toFixed(2)} ${(gy - gh).toFixed(2)} ${gw.toFixed(2)} ${gh.toFixed(2)} re S`];
  for (let c = 1; c < cols; c++) ops.push(`${(x + cw * c).toFixed(2)} ${gy.toFixed(2)} m ${(x + cw * c).toFixed(2)} ${(gy - gh).toFixed(2)} l S`);
  for (let r = 1; r < rows; r++) ops.push(`${x.toFixed(2)} ${(gy - ch * r).toFixed(2)} m ${(x + gw).toFixed(2)} ${(gy - ch * r).toFixed(2)} l S`);
  const title = calendar ? `${calendar.monthName} ${calendar.year}` : `Blank ${rows} by ${cols} calendar grid`;
  ops.push(`BT /F1 18 Tf ${x.toFixed(2)} ${(h - pt(layout.marginMm + 11)).toFixed(2)} Td (${pdfText(title)}) Tj ET`);
  if (calendar) {
    calendar.weekdays.forEach((day, c) => ops.push(`BT /F1 8 Tf ${(x + cw * c + 5).toFixed(2)} ${(gy + 7).toFixed(2)} Td (${day.slice(0, 3).toUpperCase()}) Tj ET`));
    for (const cell of calendar.cells) if (cell.day !== null) ops.push(`BT /F1 9 Tf ${(x + cw * cell.column + 6).toFixed(2)} ${(gy - ch * cell.row - 15).toFixed(2)} Td (${cell.day}) Tj ET`);
  }
  return ops.join('\n');
}

export function renderPdf(pages: Array<{ calendar: CalendarModel | null; layout: PrintLayout; rows?: number; columns?: number }>): Uint8Array {
  if (!pages.length) throw new Error('at least one PDF page is required');
  const objects: string[] = [];
  const pageRefs: number[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  for (const page of pages) {
    const stream = pdfContent(page.calendar, page.layout, page.rows, page.columns);
    const contentId = objects.length + 1;
    objects.push(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`);
    const pageId = objects.length + 1;
    const width = page.layout.pageWidthMm * 72 / 25.4;
    const height = page.layout.pageHeightMm * 72 / 25.4;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width.toFixed(2)} ${height.toFixed(2)}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageRefs.push(pageId);
  }
  objects[1] = `<< /Type /Pages /Kids [${pageRefs.map(id => `${id} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`;
  let document = '%PDF-1.4\n% deterministic calendar renderer\n';
  const offsets = [0];
  objects.forEach((body, i) => { offsets.push(new TextEncoder().encode(document).length); document += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = new TextEncoder().encode(document).length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) document += `${String(offset).padStart(10, '0')} 00000 n \n`;
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(document);
}
