# Cloudflare connection through GitHub Actions

Bundle: B4. This is the fallback when Cloudflare dashboard authentication in the agent browser or custom MCP installation is unavailable.

## Current scope

The manual `Cloudflare marketing staging` workflow builds and verifies the repository, then deploys only `zzthis-site-staging` using `wrangler.site.toml`. It runs only on `main`, uses the `cloudflare-staging` GitHub environment, and never deploys on a push or pull request. Cloudflare credentials enter only the deployment step. The lockfile supplies Wrangler through the API workspace; the workflow uses npm exec in that workspace.

This first deployment establishes Cloudflare access and a marketing preview. It does not provision the API, D1, R2, OAuth clients, signing keys, a production Worker, or DNS. Those remain the subsequent B4 staging tasks. The current `/zzthis/` build is preserved until the cutover runbook changes it.

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

API provisioning requires separately prepared staging configuration and permissions for the resources actually used: D1, the existing limiter Durable Object, governed R2, runtime secrets, and the Cron job. Do not reuse local placeholder identifiers. Keep the API's developer sign-in disabled on a public staging endpoint unless a separate access boundary is established and approved. Never generate replacement application keys on every deploy.

## Sources

- [Cloudflare GitHub Actions authentication](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Cloudflare Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/)
- [Cloudflare API token creation](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
