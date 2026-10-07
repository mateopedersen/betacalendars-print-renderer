variable "IMAGE_NAME" {
  default = "mateopedersen/betacalendars-print-renderer"
}

variable "VERSION" {
  default = "1.0.0"
}

group "default" {
  targets = ["renderer"]
}

target "renderer" {
  context    = "."
  dockerfile = "Dockerfile"
  platforms  = ["linux/amd64", "linux/arm64"]
  tags       = ["${IMAGE_NAME}:${VERSION}"]
  labels = {
    "org.opencontainers.image.title"       = "BetaCalendars Print Renderer"
    "org.opencontainers.image.description" = "Deterministic printable calendar renderer for SVG, PDF and JSON."
    "org.opencontainers.image.url"         = "https://www.betacalendars.com/"
    "org.opencontainers.image.source"      = "https://github.com/mateopedersen/betacalendars-print-renderer"
    "org.opencontainers.image.documentation" = "https://github.com/mateopedersen/betacalendars-print-renderer/tree/main/docs"
    "org.opencontainers.image.licenses"    = "MIT"
  }
  annotations = [
    "index:org.opencontainers.image.title=BetaCalendars Print Renderer",
    "index:org.opencontainers.image.description=Deterministic printable calendar renderer for SVG, PDF and JSON.",
    "index:org.opencontainers.image.url=https://www.betacalendars.com/",
    "index:org.opencontainers.image.source=https://github.com/mateopedersen/betacalendars-print-renderer",
    "index:org.opencontainers.image.licenses=MIT",
  ]
}
