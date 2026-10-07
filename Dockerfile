FROM node:24-bookworm-slim AS verification
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY src ./src
COPY test ./test
COPY scripts ./scripts
RUN node --experimental-strip-types scripts/check-source.mjs \
 && node --experimental-strip-types --test test/*.test.ts \
 && node scripts/validate-examples.mjs

FROM node:24-bookworm-slim AS runtime
ARG VERSION=1.0.0
ARG VCS_REF=unknown
ARG BUILD_DATE=unknown
LABEL org.opencontainers.image.title="BetaCalendars Print Renderer" \
      org.opencontainers.image.description="Deterministic printable calendar renderer for SVG, PDF and JSON." \
      org.opencontainers.image.version="$VERSION" \
      org.opencontainers.image.revision="$VCS_REF" \
      org.opencontainers.image.created="$BUILD_DATE" \
      org.opencontainers.image.url="https://www.betacalendars.com/" \
      org.opencontainers.image.source="https://github.com/mateopedersen/betacalendars-print-renderer" \
      org.opencontainers.image.documentation="https://github.com/mateopedersen/betacalendars-print-renderer/tree/main/docs" \
      org.opencontainers.image.licenses="MIT"
ENV NODE_ENV=production
WORKDIR /app
COPY --from=verification --chown=node:node /workspace/package.json ./package.json
COPY --from=verification --chown=node:node /workspace/src ./src
RUN mkdir -p /output && chown node:node /output
VOLUME ["/output"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "--experimental-strip-types", "src/cli.ts", "healthcheck"]
USER node
ENTRYPOINT ["node", "--experimental-strip-types", "src/cli.ts"]
CMD ["--help"]
