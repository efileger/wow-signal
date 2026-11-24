# 0001 Use a static site and direct artifact deployment

## Context

WoW Signal needs to prove its pre-feature delivery pipeline with one deployable. The discovery phase will determine what data acquisition and persistence are needed.

## Decision

Build with Astro and TypeScript in a single repository. GitHub Actions owns verification and uploads the resulting static artifact to a Cloudflare Pages Direct Upload project. Use the same workflow for on-demand recovery to a known-good Pages deployment.

## Consequences

A catalog change requires a build. The first release has no server or database to maintain. Production depends on a Cloudflare account and a Pages deployment credential held in GitHub. Revisit the static boundary when product discovery establishes a need for private data, live queries, or ingestion that runs independently of deployments.
