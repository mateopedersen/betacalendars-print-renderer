# BetaCalendars Print Renderer

Deterministic, offline-first printable calendar renderer. Produce standalone SVG, PDF, and JSON from a Gregorian calendar model with explicit week starts, grid modes, and paper geometry.

## Quick start

```sh
docker pull mateopedersen/betacalendars-print-renderer:1.0.0
docker run --rm mateopedersen/betacalendars-print-renderer:1.0.0 --help
mkdir -p output
docker run --rm -v "$(pwd)/output:/output" mateopedersen/betacalendars-print-renderer:1.0.0 \
  render month --year 2027 --month 1 --paper a4 --format svg,pdf,json
```

The output folder receives January 2027 as SVG, PDF, and JSON. The renderer makes no outbound request.

## Features

- Calendar months, years, inclusive month ranges, and undated blank grids.
- Sunday through Saturday week starts; natural or fixed six-week grids.
- A4, US Letter, A5, and Legal paper; portrait or landscape.
- SVG and PDF have physical page dimensions; yearly and range PDFs have one page per month.
- Read-only HTTP endpoints for health, month rendering, paper layout, and blank grids.
- Non-root runtime, no third-party runtime packages, read-only root filesystem support, multi-platform releases, SBOM, and build provenance.

## Common commands

```sh
# Full year as a 12-page PDF
docker run --rm -v "$(pwd)/output:/output" mateopedersen/betacalendars-print-renderer:1.0.0 \
  render year --year 2027 --format pdf

# Inclusive range as PDF and JSON
docker run --rm -v "$(pwd)/output:/output" mateopedersen/betacalendars-print-renderer:1.0.0 \
  render range --from 2026-11 --to 2027-02 --format pdf,json

# Six by seven undated grid
docker run --rm -v "$(pwd)/output:/output" mateopedersen/betacalendars-print-renderer:1.0.0 \
  render blank --rows 6 --columns 7 --paper letter --format svg,pdf,json

# HTTP service
docker run --rm -p 8080:8080 mateopedersen/betacalendars-print-renderer:1.0.0 serve
```

Try `GET http://localhost:8080/health`, `GET /v1/month/2027/1?format=json`, or `GET /v1/blank?rows=6&columns=7&format=svg`.

## Links

- Source, issues, and release history: [GitHub repository](https://github.com/mateopedersen/betacalendars-print-renderer)
- Technical docs: [CLI](https://github.com/mateopedersen/betacalendars-print-renderer/blob/main/docs/cli.md), [rendering](https://github.com/mateopedersen/betacalendars-print-renderer/blob/main/docs/rendering.md), [paper formats](https://github.com/mateopedersen/betacalendars-print-renderer/blob/main/docs/paper-formats.md), [blank calendars](https://github.com/mateopedersen/betacalendars-print-renderer/blob/main/docs/blank-calendars.md), [security](https://github.com/mateopedersen/betacalendars-print-renderer/blob/main/docs/security.md), [supply chain](https://github.com/mateopedersen/betacalendars-print-renderer/blob/main/docs/supply-chain.md)
- Beta Calendars: [home](https://www.betacalendars.com/), [blank calendar](https://www.betacalendars.com/blank-calendar), [January](https://www.betacalendars.com/january-calendar.html), [February](https://www.betacalendars.com/february-calendar.html), [March](https://www.betacalendars.com/march-calendar.html), [April](https://www.betacalendars.com/april-calendar.html), [May](https://www.betacalendars.com/may-calendar.html), [June](https://www.betacalendars.com/june-calendar.html), [July](https://www.betacalendars.com/july-calendar.html), [August](https://www.betacalendars.com/august-calendar.html), [September](https://www.betacalendars.com/september-calendar.html), [October](https://www.betacalendars.com/october-calendar.html), [November](https://www.betacalendars.com/november-calendar.html), [December](https://www.betacalendars.com/december-calendar.html)

MIT licensed. See the [license](https://github.com/mateopedersen/betacalendars-print-renderer/blob/main/LICENSE).
