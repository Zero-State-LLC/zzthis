# Cloudflare connection through GitHub Actions

Bundle: B4. This documents the GitHub Actions deployment path.

## Current scope

The manual `Cloudflare marketing staging` workflow builds and verifies the repository, then deploys only `zzthis-site-staging` using `wrangler.site.toml`. It runs only on `main`, uses the `cloudflare-staging` GitHub environment, and never deploys on a push or pull request. Cloudflare credentials enter only the deployment step. The lockfile supplies Wrangler through the API workspace; the workflow uses npm exec in that workspace.

The first deployment established Cloudflare access and a marketing preview on 2026-10-07. It did not provision the API, R2, OAuth clients, signing keys, a production Worker, or DNS. A separate `zzthis-staging` D1 database was created and health-checked; it is not yet bound to an API Worker. Those remain the subsequent B4 staging tasks. The current `/zzthis/` build is preserved until the cutover runbook changes it.

### Observed marketing staging deployment

The manual workflow completed successfully as [run 37550094879](https://github.com/Zero-State-LLC/zzthis/actions/runs/37550094879) from source SHA `b2350d47b67bcb4e5d1a8ed19354d92d3840596c`. Wrangler deployed `zzthis-site-staging` version `8da9a4ff-2e80-46c3-aec2-76c08edd5191` at `https://zzthis-site-staging.zer0state-noema.workers.dev`. Direct smoke checks observed HTTP 200 for `/` and HTTP 404 for an unknown path. This is staging evidence only; it is neither route parity evidence nor production authorization.

## Operator connection

1. Open the Cloudflare dashboard in your own browser. Select the account that will own zzThis.
2. Create an API token named `zzthis-github-staging`. Cloudflare documents the **Edit Cloudflare Workers** template for GitHub deployment. Restrict resources to the selected account. Remove unrelated DNS/zone, KV, and R2 permissions for this marketing-only deployment. Ensure the token can create the new staging Worker; under the current Workers role model, creation requires product-level Admin access. After the Worker exists, narrow deployment access to that Worker where supported. Do not use a Global API key.
3. In the zzThis GitHub repository, go to **Settings → Environments** and create `cloudflare-staging`. Limit deployment branches to `main`. Use required reviewers if available under the repository plan.
4. Add these **environment secrets**, with exact names:

   | Name | Value |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | the scoped Cloudflare token |
   | `CLOUDFLARE_ACCOUNT_ID` | the selected Cloudflare account ID |

5. Merge the reviewed B4 staging PR before dispatching. In **Actions → Cloudflare marketing staging**, choose **Run workflow** on `main`.
6. Record the actual Wrangler URL, Worker version/deployment identifier, source SHA, and route checks. Follow `docs/cloudflare-site-cutover.md` for parity and rollback. A successful deployment alone does not complete B4 or authorize production cutover.

Do not paste the token into chat, issues, pull requests, repository files, or workflow inputs. GitHub stores the token as an encrypted secret; the agent does not need to read it. Setting a secret authorizes the named workflow to use it; it does not authenticate this local agent or provide direct dashboard/API access.

## API staging next

API provisioning requires separately prepared staging configuration and permissions for the resources actually used: the `zzthis-staging` D1 binding, the staging limiter Durable Object, governed R2 if remote photo-read testing is authorized, runtime secrets, and the Cron job. Do not reuse local placeholder identifiers or bind any production state. Keep the API's developer sign-in disabled on a public staging endpoint unless a separate access boundary is established and approved. Never generate replacement application keys on every deploy.

## Sources

- [Cloudflare GitHub Actions authentication](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Cloudflare Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/)
- [Cloudflare API token creation](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
