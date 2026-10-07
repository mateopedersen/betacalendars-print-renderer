#!/usr/bin/env node
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { createCalendar, monthRange, type CalendarModel, type GridMode, type Orientation, type Paper, type Weekday } from './calendar.ts';
import { printLayout, type LayoutOptions } from './geometry.ts';
import { calendarJson, renderBlankSvg, renderMonthSvg, renderPdf } from './render.ts';

type Args = Record<string, string | boolean | string[]>;
const usage = `BetaCalendars Print Renderer 1.0.0

Usage:
  betacal render month --year 2027 --month 1 [options]
  betacal render year --year 2027 [options]
  betacal render range --from 2026-11 --to 2027-02 [options]
  betacal render blank [--rows 5 --columns 7] [options]
  betacal inspect topology --year 2027 --month 2 [options]
  betacal inspect layout [options]
  betacal serve [--port 8080]

Options:
  --week-start <weekday>   sunday, monday, tuesday, wednesday, thursday, friday, saturday
  --grid <mode>            natural | fixed-six-weeks
  --paper <format>         a4 | letter | a5 | legal
  --orientation <mode>     portrait | landscape
  --format <formats>       svg,pdf,json (may be repeated)
  --output <path>          File path for a single artifact or output directory
  --margin <mm> --header-height <mm> --weekday-header-height <mm> --notes-height <mm>

Examples:
  docker run --rm -v "$(pwd)/output:/output" mateopedersen/betacalendars-print-renderer:1.0.0 render month --year 2027 --month 1 --paper a4 --format svg,pdf,json
  docker run --rm -v "$(pwd)/output:/output" mateopedersen/betacalendars-print-renderer:1.0.0 render year --year 2027 --format pdf
  docker run --rm -p 8080:8080 mateopedersen/betacalendars-print-renderer:1.0.0 serve`;

function parseArgs(tokens: string[]): Args {
  const result: Args = {};
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (!token.startsWith('--')) throw new Error(`unexpected argument: ${token}`);
    const key = token.slice(2);
    if (key === 'help') { result.help = true; continue; }
    const value = tokens[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`missing value for --${key}`);
    if (key === 'format') result.format = [...(Array.isArray(result.format) ? result.format : result.format ? [String(result.format)] : []), value];
    else result[key] = value;
    i++;
  }
  return result;
}

function str(args: Args, key: string, fallback: string): string { return typeof args[key] === 'string' ? String(args[key]) : fallback; }
function num(args: Args, key: string, fallback: number): number { const raw = args[key]; if (raw === undefined) return fallback; const n = Number(raw); if (!Number.isFinite(n)) throw new Error(`--${key} must be numeric`); return n; }
function formats(args: Args): Array<'svg' | 'pdf' | 'json'> {
  const value = args.format === undefined ? 'svg' : (Array.isArray(args.format) ? args.format : [String(args.format)]).join(',');
  const list = value.split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
  if (!list.length || list.some(v => !['svg', 'pdf', 'json'].includes(v))) throw new Error('--format accepts svg, pdf, json');
  return [...new Set(list)] as Array<'svg' | 'pdf' | 'json'>;
}
function layoutOptions(args: Args): LayoutOptions {
  return {
    paper: str(args, 'paper', 'a4') as Paper,
    orientation: str(args, 'orientation', 'portrait') as Orientation,
    margin: num(args, 'margin', 10),
    headerHeight: num(args, 'header-height', 15),
    weekdayHeaderHeight: num(args, 'weekday-header-height', 8),
    notesHeight: num(args, 'notes-height', 20),
  };
}
function modelOptions(args: Args): { weekStart: Weekday; grid: GridMode } {
  return { weekStart: str(args, 'week-start', 'sunday') as Weekday, grid: str(args, 'grid', 'natural') as GridMode };
}
function filenameFor(model: CalendarModel, format: string): string { return `${model.monthName.toLowerCase()}-${model.year}.${format}`; }
async function saveArtifact(target: string, data: string | Uint8Array): Promise<void> {
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, data);
}
async function outputPath(args: Args, filename: string, formatCount: number, format: string): Promise<string> {
  const configured = str(args, 'output', '/output');
  const resolved = resolve(configured);
  const isFile = formatCount === 1 && extname(resolved).toLowerCase() === `.${format}`;
  const target = isFile ? resolved : join(resolved, filename);
  await mkdir(isFile ? dirname(target) : target === '/output' ? target : dirname(target), { recursive: true });
  return target;
}

async function writeModels(models: CalendarModel[], args: Args): Promise<string[]> {
  const selectedFormats = formats(args); const layoutOpts = layoutOptions(args); const created: string[] = [];
  const multipleMonths = models.length > 1;
  for (const format of selectedFormats) {
    if (format === 'pdf') {
      const bytes = renderPdf(models.map(model => ({ calendar: model, layout: printLayout({ ...layoutOpts, rows: model.rowCount }) })));
      const name = multipleMonths ? `calendar-${models[0]!.year}-${models[0]!.month}-${models.at(-1)!.year}-${models.at(-1)!.month}.pdf` : filenameFor(models[0]!, 'pdf');
      const path = await outputPath(args, name, selectedFormats.length, format); await saveArtifact(path, bytes); created.push(path);
    } else if (format === 'json') {
      const docs = models.map(model => calendarJson(model, printLayout({ ...layoutOpts, rows: model.rowCount })));
      const data = JSON.stringify(multipleMonths ? { generator: { name: 'BetaCalendars Print Renderer', version: '1.0.0' }, calendars: docs } : docs[0], null, 2) + '\n';
      const name = multipleMonths ? `calendar-${models[0]!.year}-${models[0]!.month}-${models.at(-1)!.year}-${models.at(-1)!.month}.json` : filenameFor(models[0]!, 'json');
      const path = await outputPath(args, name, selectedFormats.length, format); await saveArtifact(path, data); created.push(path);
    } else {
      for (const model of models) {
        const data = renderMonthSvg({ ...layoutOpts, ...modelOptions(args), year: model.year, month: model.month });
        const path = await outputPath(args, filenameFor(model, format), selectedFormats.length, format); await saveArtifact(path, data); created.push(path);
      }
    }
  }
  return created;
}

async function renderBlank(args: Args): Promise<void> {
  const rows = num(args, 'rows', 5); const columns = num(args, 'columns', 7); const options = layoutOptions(args);
  const selectedFormats = formats(args); const created: string[] = [];
  const layout = printLayout({ ...options, rows, columns });
  for (const format of selectedFormats) {
    const data = format === 'svg' ? renderBlankSvg({ ...options, rows, columns })
      : format === 'pdf' ? renderPdf([{ calendar: null, layout, rows, columns }])
      : JSON.stringify({ grid: { type: 'blank', rows, columns, cells: rows * columns }, paper: { format: layout.paper, orientation: layout.orientation }, layout, references: { homepage: 'https://www.betacalendars.com/', blank: 'https://www.betacalendars.com/blank-calendar' }, generator: { name: 'BetaCalendars Print Renderer', version: '1.0.0' } }, null, 2) + '\n';
    const filename = `blank-${rows}x${columns}.${format}`; const path = await outputPath(args, filename, selectedFormats.length, format); await saveArtifact(path, data); created.push(path);
  }
  console.log(created.join('\n'));
}

function jsonReply(response: import('node:http').ServerResponse, status: number, value: unknown): void { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(value) + '\n'); }
function queryLayout(url: URL, rows = 6): LayoutOptions {
  return { paper: (url.searchParams.get('paper') ?? 'a4') as Paper, orientation: (url.searchParams.get('orientation') ?? 'portrait') as Orientation,
    margin: Number(url.searchParams.get('margin') ?? 10), headerHeight: Number(url.searchParams.get('headerHeight') ?? 15), weekdayHeaderHeight: Number(url.searchParams.get('weekdayHeaderHeight') ?? 8), notesHeight: Number(url.searchParams.get('notesHeight') ?? 20), rows };
}
function startServer(port: number): void {
  const server = createServer((request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (request.method !== 'GET') { response.writeHead(405, { allow: 'GET' }); response.end(); return; }
      if (url.pathname === '/health') { jsonReply(response, 200, { status: 'ok', service: 'betacalendars-print-renderer' }); return; }
      const monthMatch = /^\/v1\/month\/(\d{4})\/(\d{1,2})$/.exec(url.pathname);
      if (monthMatch) {
        const year = Number(monthMatch[1]); const month = Number(monthMatch[2]);
        const model = createCalendar({ year, month, weekStart: (url.searchParams.get('weekStart') ?? 'sunday') as Weekday, grid: (url.searchParams.get('grid') ?? 'natural') as GridMode });
        const layout = printLayout(queryLayout(url, model.rowCount)); const format = url.searchParams.get('format') ?? 'json';
        if (format === 'svg') { response.writeHead(200, { 'content-type': 'image/svg+xml; charset=utf-8' }); response.end(renderMonthSvg({ year, month, ...queryLayout(url, model.rowCount), weekStart: model.weekStart, grid: model.grid })); return; }
        if (format === 'pdf') { const pdf = renderPdf([{ calendar: model, layout }]); response.writeHead(200, { 'content-type': 'application/pdf' }); response.end(pdf); return; }
        if (format !== 'json') { jsonReply(response, 400, { error: 'format must be svg, pdf, or json' }); return; }
        jsonReply(response, 200, calendarJson(model, layout)); return;
      }
      const layoutMatch = /^\/v1\/print-layout\/(\d{4})\/(\d{1,2})$/.exec(url.pathname);
      if (layoutMatch) {
        const model = createCalendar({ year: Number(layoutMatch[1]), month: Number(layoutMatch[2]), weekStart: (url.searchParams.get('weekStart') ?? 'sunday') as Weekday, grid: (url.searchParams.get('grid') ?? 'natural') as GridMode });
        jsonReply(response, 200, printLayout(queryLayout(url, model.rowCount))); return;
      }
      if (url.pathname === '/v1/blank') {
        const rows = Number(url.searchParams.get('rows') ?? 5); const columns = Number(url.searchParams.get('columns') ?? 7); const opts = { ...queryLayout(url, rows), columns }; const format = url.searchParams.get('format') ?? 'json';
        if (format === 'svg') { response.writeHead(200, { 'content-type': 'image/svg+xml; charset=utf-8' }); response.end(renderBlankSvg({ ...opts, rows, columns })); return; }
        if (format === 'pdf') { response.writeHead(200, { 'content-type': 'application/pdf' }); response.end(renderPdf([{ calendar: null, layout: printLayout(opts), rows, columns }])); return; }
        jsonReply(response, 200, { grid: { type: 'blank', rows, columns, cells: rows * columns }, layout: printLayout(opts), references: { blank: 'https://www.betacalendars.com/blank-calendar' } }); return;
      }
      jsonReply(response, 404, { error: 'not found' });
    } catch (error) { jsonReply(response, 400, { error: error instanceof Error ? error.message : 'invalid request' }); }
  });
  server.listen(port, '0.0.0.0', () => console.log(`calendar renderer listening on 0.0.0.0:${port}`));
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
}

async function main(): Promise<void> {
  const tokens = process.argv.slice(2);
  if (!tokens.length || tokens.includes('--help') || tokens[0] === 'help') { console.log(usage); return; }
  const [group, command, ...rest] = tokens;
  if (group === 'serve') { const args = parseArgs([command, ...rest].filter(Boolean) as string[]); const port = num(args, 'port', 8080); if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('--port must be from 1 to 65535'); startServer(port); return; }
  if (group === 'healthcheck') {
    try { const response = await fetch('http://127.0.0.1:8080/health', { signal: AbortSignal.timeout(1500) }); if (!response.ok) process.exitCode = 1; }
    catch { process.exitCode = 1; }
    return;
  }
  if (!command) throw new Error('missing command');
  const args = parseArgs(rest);
  if (group === 'inspect' && command === 'topology') {
    const model = createCalendar({ year: num(args, 'year', 0), month: num(args, 'month', 0), ...modelOptions(args) });
    console.log(JSON.stringify({ daysInMonth: model.daysInMonth, firstWeekday: model.firstWeekday, lastWeekday: model.lastWeekday, leadingCells: model.leadingCells, trailingCells: model.trailingCells, rowCount: model.rowCount, fixedCellCount: model.fixedCellCount, topologySignature: model.topologySignature, cells: model.cells }, null, 2)); return;
  }
  if (group === 'inspect' && command === 'layout') {
    const rows = num(args, 'rows', 6); console.log(JSON.stringify(printLayout({ ...layoutOptions(args), rows }), null, 2)); return;
  }
  if (group !== 'render') throw new Error(`unknown command: ${group} ${command}`);
  if (command === 'blank') { await renderBlank(args); return; }
  let models: CalendarModel[];
  if (command === 'month') {
    const year = num(args, 'year', 0); const month = num(args, 'month', 0);
    models = [createCalendar({ year, month, ...modelOptions(args) })];
  } else if (command === 'year') {
    const year = num(args, 'year', 0); if (!Number.isInteger(year) || year < 1 || year > 9999) throw new RangeError('year must be an integer from 1 to 9999');
    models = Array.from({ length: 12 }, (_, i) => createCalendar({ year, month: i + 1, ...modelOptions(args) }));
  } else if (command === 'range') {
    const list = monthRange(str(args, 'from', ''), str(args, 'to', ''));
    models = list.map(value => createCalendar({ ...value, ...modelOptions(args) }));
  } else throw new Error(`unknown render command: ${command}`);
  const created = await writeModels(models, args); console.log(created.join('\n'));
}

main().catch(error => { console.error(`betacal: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 2; });
