# Build and supply chain

The repository uses GitHub Actions for source checks, regression tests, render-artifact checks, and container validation. Version tags trigger a multi-platform image build for `linux/amd64` and `linux/arm64`.

The release workflow attaches an SPDX SBOM and max-level build provenance. Docker Hub login uses a dedicated Docker Hub access token stored as the GitHub Actions secret `DOCKERHUB_TOKEN`; the username is the repository variable `DOCKERHUB_USERNAME`. No credential is used during the build itself. Never place credentials in Docker build arguments or source files.

To reproduce locally, use Node.js 24.x and run `npm test`, `npm run lint`, and `npm run validate:examples`, then `docker build -t betacal-local:test .`. Docker Scout can scan the current published image with `docker scout cves mateopedersen/betacalendars-print-renderer:latest`; record scan date and results when sharing a vulnerability count.
