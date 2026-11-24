# WoW Signal

WoW Signal helps World of Warcraft Forever players assess and compare add-ons using evidence beyond downloads and popularity. The first release serves a sample catalog to exercise development, deployment, and recovery. The sample does not imply a compatibility or quality rating.

See the [product direction](docs/product/vision.md) for what WoW Signal aims to measure and the scope of the first product release.

## Develop in Codex Cloud

From the repository root, run:

```sh
bash scripts/bootstrap
npm run task -- dev -- --host 0.0.0.0 --port 4321
npm run task -- check
npm run task -- verify
```

If Astro starts in the background, use `npm run dev -- status` or `npm run dev -- stop`. Use the pinned Linux toolchain in [the architecture notes](docs/architecture/README.md). Run setup again when the lockfiles or tool pins change. Use [AGENTS.md](AGENTS.md) for the issue and review workflow, and [the delivery runbook](docs/architecture/delivery.md) for Cloudflare setup and recovery.
