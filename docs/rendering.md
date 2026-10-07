# Rendering and calendar model

The renderer uses integer civil-calendar arithmetic and explicit configuration. It does not use the host locale, a remote calendar API, or a date service. Gregorian leap-year rules apply: divisible by four, except century years unless divisible by 400.

## Grids

`natural` emits the smallest whole-week grid that contains every day of the month. `fixed-six-weeks` always emits 42 cells. Weekday columns are rotated according to the selected week start. Empty cells have no date value.

The JSON output includes calendar metadata, cells, row count, layout, and a topology signature. The signature describes the grid structure and is useful for stable comparisons across formatting changes.

## Formats

- SVG is standalone XML with physical width and height, no scripts, and no external assets.
- PDF is generated from the same model and geometry. Year and range PDFs contain one page for every requested month.
- JSON exposes the model and layout for downstream applications.

SVG/PDF dimensions use millimeters converted to PDF points at 72 points per inch. The content area subtracts margins, title band, weekday band, and notes band from the paper size. Printer margins vary; the geometry describes the document, not a particular printer.
