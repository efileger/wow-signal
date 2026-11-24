# Delivery and recovery

## One-time Cloudflare setup

1. In **Workers & Pages**, create a **Pages** project using **Direct Upload**. Use the project name `wow-signal` if available and select `main` as the production branch. If the dashboard requires an initial upload, create the empty project with Wrangler's `pages project create wow-signal --production-branch main` using your authorized Cloudflare session. GitHub Actions owns application deployments.
2. Copy the **Account ID**. Create an API token with **Account → Cloudflare Pages → Edit**, restricted to the account that owns the project.
3. In GitHub **Settings → Environments**, create `production` and restrict deployments to `main`. Add environment variables `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_PROJECT_NAME`, and the environment secret `CLOUDFLARE_API_TOKEN`. The initial address is `https://<project>.pages.dev`.

[Direct Upload setup](https://developers.cloudflare.com/pages/get-started/direct-upload/) · [Cloudflare credentials for CI](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)

## Verify and release

After the first PR runs, require `verify` on `main` and require branches to be up to date before merging. The `Delivery` workflow repeats verification on merge, compares two static builds, and uploads one checksummed archive. The production job verifies the archive and deploys the exact static files. It records the Pages production deployment ID and checks the public catalog and revision with bounded retries. Production jobs serialize and stale trunk commits are skipped before upload.

The local artifact acceptance tests decide what is releasable. Public verification checks the actual deployment. Inspect production job failures in GitHub Actions. A confirmed serving regression is grounds to roll back.

## Roll back on demand

1. Pause merges and check the Actions queue for pending production deliveries. Locate the deployment ID of the last healthy **production** revision in a successful delivery run or the Pages dashboard.
2. In **Actions → Delivery → Run workflow**, select `main` and enter that ID. The workflow checks the target is a successful production deployment, invokes the Pages rollback API, and verifies the public catalog and restored revision.
3. Record the restoration in the issue. Revert or fix the regression on `main` and resume normal delivery after verification.

[Cloudflare Pages rollback](https://developers.cloudflare.com/pages/configuration/rollbacks/)
