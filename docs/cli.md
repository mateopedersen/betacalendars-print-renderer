# CLI reference

Run `betacal --help` for the concise command list. In the container, invoke it with `docker run --rm IMAGE ...`.

## Calendar renderers

- `render month --year YYYY --month M` renders one month (year 1–9999, month 1–12).
- `render year --year YYYY` renders January through December as twelve SVG files or a twelve-page PDF.
- `render range --from YYYY-MM --to YYYY-MM` renders an inclusive range of at most 120 months.
- `render blank --rows N --columns N` produces an undated grid (1–20 rows, 1–14 columns).

Options: `--week-start sunday|monday|tuesday|wednesday|thursday|friday|saturday`, `--grid natural|fixed-six-weeks`, `--paper a4|letter|a5|legal`, `--orientation portrait|landscape`, `--format svg,pdf,json`, and `--output PATH`.

Layout options in millimeters: `--margin`, `--header-height`, `--weekday-header-height`, and `--notes-height`. Defaults are 10, 15, 8, and 20 mm. `--output` names a file when one format is selected and its extension matches; otherwise it names a directory. Default directory is `/output`.

## Inspection

`inspect topology --year YYYY --month M [calendar options]` emits month structure and a stable topology signature. `inspect layout --paper a4 --orientation portrait --rows 6 --margin 10` emits the computed printable geometry.

## Exit behavior

Invalid command-line values print an error and exit with code 2. A valid render prints created file paths. The CLI does not fetch data or write outside the selected output path.
