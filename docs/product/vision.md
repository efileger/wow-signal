# WoW Signal product direction

WoW Signal helps World of Warcraft Forever players decide whether an add-on is worth trying and fits their needs. Downloads, favorites, and word of mouth can tell players what is popular. Players still need evidence about what an add-on does, whether it works for their client, and how well it is maintained. As AI tools make it easier to publish add-ons, that evidence becomes more valuable.

## What we measure

The core product is the method for turning observable evidence into a useful assessment. Start with client compatibility, maintenance and maintainer responsiveness, verifiable add-on practices, and fit for a specific job. Contribution activity is context, especially for a stable add-on that rarely needs changes. Compare overlapping add-ons on practical differences such as client support, configuration, and workload. Judge the resulting add-on and its documented practices regardless of the tools used to make it.

Show the dimensions that drive an assessment, the evidence behind them, when the evidence was collected, and which parts are uncertain. Treat unavailable evidence as unknown and make clear when a result is stale. Compare like use cases and game clients. Start with explainable assessments and validate them against player decisions and a popularity-only baseline. An overall score or ranking earns its place if it helps those decisions and its drivers are clear.

## First release

Evaluate a small set of add-ons for one player need and one game client. Use permitted, repeatable evidence collection. Give players a fast, responsive page where they can see fit, key differences, and evidence at a glance, with details and the method available on demand. Once enough comparable observations exist, show dated trends inspired by FiveThirtyEight’s polling pages. Track freshness as the catalog changes and distinguish a change in an add-on from a change in the scoring method.

The initial scope ends at assessment and comparison. Personalized discovery, trending feeds, accounts, installation, distribution, coverage across games, and a general-purpose platform can wait. WoW add-ons are the first test of a method that may eventually transfer to other ecosystems.

## Architecture and delivery

Keep source collection, stored evidence, assessment, and presentation as distinct responsibilities with versioned data contracts. Record where each observation came from and make scoring replayable against saved evidence. Astro and static delivery support the first slice. Add scheduled ingestion, database storage, or a serving API when refresh, history, or consumer needs warrant them. Keep configuration external, jobs repeatable, backing services replaceable, and releases reproducible, following the relevant Twelve-Factor principles. Keep these boundaries within the existing monorepo and evaluate Rust if a measured bottleneck merits it.

Run recurring dependency and vulnerability checks and use Renovate or Dependabot to propose reviewed updates. Verify the behavior each dependency touches and require a deployable artifact through the shared CI gate. Enable auto-merge for narrowly defined update classes after a reviewed trial demonstrates reliable gates, healthy production deployments, and a working rollback path.
