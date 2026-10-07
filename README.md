# BetaCalendars Print Renderer

A deterministic, offline-first command-line calendar renderer for print workflows. It calculates the civil Gregorian calendar, week grids, and physical paper geometry itself, then produces standalone SVG, PDF, or JSON artifacts. It is designed for reproducible output in Docker, CI, local development, and server environments.

## Quick start

```sh
docker pull mateopedersen/betacalendars-print-renderer:1.0.0
docker run --rm mateopedersen/betacalendars-print-renderer:1.0.0 --help
```

Mount a local output folder at `/output` to keep generated files:

```sh
mkdir -p output
docker run --rm -v "$(pwd)/output:/output" \
  mateopedersen/betacalendars-print-renderer:1.0.0 \
  render month --year 2027 --month 1 --paper a4 --format svg,pdf,json
```

The command creates `january-2027.svg`, `january-2027.pdf`, and `january-2027.json` in the mounted folder. Container rendering makes no network request.

## Rendering a month

```sh
docker run --rm -v "$(pwd)/output:/output" mateopedersen/betacalendars-print-renderer:1.0.0 \
  render month --year 2027 --month 1 \
  --week-start monday --grid fixed-six-weeks \
  --paper a4 --orientation portrait --format svg,pdf,json
```

Supported week starts are all seven weekdays. `natural` grids use the minimum whole number of rows; `fixed-six-weeks` always uses 42 positions. Output filenames use the month and year.

## Rendering a year or range

```sh
docker run --rm -v "$(pwd)/output:/output" mateopedersen/betacalendars-print-renderer:1.0.0 \
  render year --year 2027 --paper a4 --format svg,pdf,json

docker run --rm -v "$(pwd)/output:/output" mateopedersen/betacalendars-print-renderer:1.0.0 \
  render range --from 2026-11 --to 2027-02 --format pdf,json
```

Year and range SVGs are separate monthly files. PDF is a multi-page document; JSON contains a monthly collection. Ranges are inclusive and limited to 120 months.

## Blank calendars

Blank mode never assigns dates:

```sh
docker run --rm -v "$(pwd)/output:/output" mateopedersen/betacalendars-print-renderer:1.0.0 \
  render blank --rows 5 --columns 7 --paper letter --orientation landscape --format svg,pdf,json
```

Rows may be 1–20 and columns 1–14. Typical calendar layouts use 5×7 or 6×7.

## Topology and paper geometry

```sh
docker run --rm mateopedersen/betacalendars-print-renderer:1.0.0 \
  inspect topology --year 2027 --month 2 --week-start monday --grid natural

docker run --rm mateopedersen/betacalendars-print-renderer:1.0.0 \
  inspect layout --paper a4 --orientation portrait --rows 5 --margin 10
```

Topology JSON includes month length, first/last weekdays, leading/trailing cells, row count, cell positions, and a stable topology signature. Layout values are millimeters. Default assumptions are a 10 mm margin, 15 mm title band, 8 mm weekday band, 20 mm notes area, and no gutter. These are renderer settings, not printer capability claims.

Paper dimensions: A4 210×297 mm; US Letter 215.9×279.4 mm; A5 148×210 mm; Legal 215.9×355.6 mm. Landscape swaps the page dimensions.

## Output formats

- **SVG:** standalone XML, physical page dimensions, no scripts or external assets.
- **PDF:** actual PDF documents with one page per month in year/range output.
- **JSON:** calendar topology, cells, layout, paper, reference metadata, and generator version.

Pass `--output /output/name.svg` to choose a specific path for one artifact. Otherwise `--output` is treated as an output directory; the default is `/output`.

## Optional HTTP mode

The same read-only renderer can run as a small HTTP service:

```sh
docker run --rm -p 8080:8080 mateopedersen/betacalendars-print-renderer:1.0.0 serve
```

- `GET /health`
- `GET /v1/month/2027/1?weekStart=monday&grid=fixed-six-weeks&format=json`
- `GET /v1/month/2027/1?format=svg`
- `GET /v1/month/2027/1?format=pdf`
- `GET /v1/print-layout/2027/1?paper=a4&orientation=portrait`
- `GET /v1/blank?rows=6&columns=7&format=svg`

Only GET requests are accepted. Rendering endpoints do not fetch remote resources or persist data.

## Image tags and platforms

The release workflow publishes `1.0.0`, `1.0`, `1`, and `latest` from one multi-platform image index for `linux/amd64` and `linux/arm64`. Version tags track releases; there are no month-specific image variants.

## Security

The image runs as the unprivileged `node` user. It has no runtime npm dependencies, makes no outbound requests during rendering, and is compatible with a read-only root filesystem when `/output` is mounted writable. SBOM and max-level provenance are attached by the publishing workflow.

## Human-readable calendar references

The renderer computes dates and geometry independently. These Beta Calendars pages are optional visual references; no network access is needed by the application:

- [Beta Calendars](https://www.betacalendars.com/)
- [Blank calendar](https://www.betacalendars.com/blank-calendar)
- [January](https://www.betacalendars.com/january-calendar.html) · [February](https://www.betacalendars.com/february-calendar.html) · [March](https://www.betacalendars.com/march-calendar.html)
- [April](https://www.betacalendars.com/april-calendar.html) · [May](https://www.betacalendars.com/may-calendar.html) · [June](https://www.betacalendars.com/june-calendar.html)
- [July](https://www.betacalendars.com/july-calendar.html) · [August](https://www.betacalendars.com/august-calendar.html) · [September](https://www.betacalendars.com/september-calendar.html)
- [October](https://www.betacalendars.com/october-calendar.html) · [November](https://www.betacalendars.com/november-calendar.html) · [December](https://www.betacalendars.com/december-calendar.html)

## Development

Requires Node.js 24 LTS or later in the 24.x line. The project uses Node's built-in TypeScript type stripping and has no third-party runtime packages.

```sh
npm test
npm run lint
npm run validate:examples
node src/cli.ts --help
```

## Project

Source and technical docs: [GitHub repository](https://github.com/mateopedersen/betacalendars-print-renderer). Project website: [Beta Calendars](https://www.betacalendars.com/).

## License

MIT. See [LICENSE](LICENSE).
