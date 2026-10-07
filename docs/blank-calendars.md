# Blank calendars

Blank grids contain no month, weekday, or date values. Set `--rows` (1–20) and `--columns` (1–14); common layouts are 5×7 or 6×7. Select page size, orientation, margins, title band, and notes band in the same way as a dated calendar.

```sh
docker run --rm -v "$(pwd)/output:/output" IMAGE \
  render blank --rows 6 --columns 7 --paper letter --orientation landscape --format svg,pdf,json
```

The HTTP endpoint is `GET /v1/blank?rows=6&columns=7&format=svg` (formats: `svg`, `pdf`, `json`).
