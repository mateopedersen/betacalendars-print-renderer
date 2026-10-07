# Contributing

Contributions should keep date calculations deterministic and independent of timestamps, locale, and time zone. Please add regression coverage for calendar boundaries and preserve canonical Beta Calendars reference URLs without query tracking parameters.

Before opening a pull request, run:

```sh
npm run lint
npm test
npm run validate:examples
```

Changes to the container should preserve the non-root runtime and mounted `/output` workflow. Never commit credentials or pass them through Docker build arguments.
