import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalendar, daysFromCivil, daysInMonth, isLeapYear, monthRange, weekdayIndex, WEEKDAYS } from '../src/calendar.ts';
import { printLayout } from '../src/geometry.ts';
import { calendarJson, renderBlankSvg, renderMonthSvg, renderPdf } from '../src/render.ts';

test('Gregorian leap-year fixtures', () => {
  for (const [year, expected] of [[1900, false], [2000, true], [2024, true], [2027, false], [2100, false], [2400, true]] as const) assert.equal(isLeapYear(year), expected, String(year));
});

test('month lengths and civil weekday progression agree across 1900–2100', () => {
  let count = 0;
  for (let year = 1900; year <= 2100; year++) for (let month = 1; month <= 12; month++) {
    const model = createCalendar({ year, month }); const expected = daysInMonth(year, month);
    assert.equal(model.cells.filter(cell => cell.inCurrentMonth).length, expected);
    assert.equal(model.cells.length, model.rowCount * 7);
    assert.equal(model.cells.filter(cell => cell.day !== null).length, expected);
    for (let day = 1; day <= expected; day++) {
      if (day < expected) assert.equal(daysFromCivil(year, month, day + 1) - daysFromCivil(year, month, day), 1);
      assert.equal(weekdayIndex(year, month, day), (model.firstWeekday + day - 1) % 7);
    }
    count++;
  }
  assert.equal(count, 201 * 12);
});

test('every week start yields valid nonduplicated 7-column grids', () => {
  for (let year = 1900; year <= 2100; year++) for (let month = 1; month <= 12; month++) for (const weekStart of WEEKDAYS) {
    const natural = createCalendar({ year, month, weekStart });
    const fixed = createCalendar({ year, month, weekStart, grid: 'fixed-six-weeks' });
    assert.ok(natural.rowCount >= 4 && natural.rowCount <= 6);
    assert.equal(fixed.cells.length, 42);
    assert.equal(fixed.rowCount, 6);
    const dated = natural.cells.filter(cell => cell.date !== null);
    assert.equal(new Set(dated.map(cell => cell.date)).size, daysInMonth(year, month));
    for (const [i, cell] of natural.cells.entries()) { assert.equal(cell.row, Math.floor(i / 7)); assert.equal(cell.column, i % 7); }
  }
});

test('known topology and year rollover range', () => {
  const jan = createCalendar({ year: 2027, month: 1, weekStart: 'monday' });
  assert.equal(jan.firstWeekday, 5);
  assert.equal(jan.leadingCells, 4);
  assert.equal(jan.rowCount, 5);
  assert.deepEqual(monthRange('2026-11', '2027-02'), [{ year: 2026, month: 11 }, { year: 2026, month: 12 }, { year: 2027, month: 1 }, { year: 2027, month: 2 }]);
});

test('paper geometry matches physical dimensions and orientation', () => {
  assert.deepEqual([printLayout({ paper: 'a4' }).pageWidthMm, printLayout({ paper: 'a4' }).pageHeightMm], [210, 297]);
  assert.deepEqual([printLayout({ paper: 'letter' }).pageWidthMm, printLayout({ paper: 'letter' }).pageHeightMm], [215.9, 279.4]);
  assert.deepEqual([printLayout({ paper: 'a5' }).pageWidthMm, printLayout({ paper: 'a5' }).pageHeightMm], [148, 210]);
  assert.deepEqual([printLayout({ paper: 'legal' }).pageWidthMm, printLayout({ paper: 'legal' }).pageHeightMm], [215.9, 355.6]);
  const landscape = printLayout({ paper: 'a4', orientation: 'landscape' }); assert.equal(landscape.pageWidthMm, 297); assert.equal(landscape.pageHeightMm, 210);
});

test('SVG, PDF and JSON outputs are real deterministic artifacts', () => {
  const model = createCalendar({ year: 2027, month: 1 }); const layout = printLayout({ paper: 'a4', rows: model.rowCount });
  const svg = renderMonthSvg({ year: 2027, month: 1 });
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /<title id="title">January 2027 calendar<\/title>/);
  assert.doesNotMatch(svg, /<script|<image|href=|url\(/i);
  assert.match(renderBlankSvg({ rows: 6, columns: 7 }), /Blank 6 by 7 calendar grid/);
  const pdf = renderPdf([{ calendar: model, layout }, { calendar: model, layout }]);
  assert.equal(new TextDecoder().decode(pdf.slice(0, 8)), '%PDF-1.4');
  assert.match(new TextDecoder().decode(pdf), /\/Count 2/);
  assert.match(new TextDecoder().decode(pdf), /\/MediaBox \[0 0 595\.28 841\.89\]/);
  const json = JSON.stringify(calendarJson(model, layout)); assert.match(json, /"generator"/); assert.match(json, /https:\/\/www\.betacalendars\.com\/january-calendar\.html/);
});
