# Intent: connect Cloudflare staging through GitHub

Author: Codex, from Daniel's setup request
Date: 2026-10-06
Status: accepted
Accepted-by: Daniel's direct request to set up Cloudflare, followed by the unavailable browser/MCP connection reports in this session.
Product: zzThis (`Zero-State-LLC/zzthis`)

## Problem

The agent browser cannot complete Cloudflare verification, and the user's ChatGPT app does not offer custom MCP creation. B4 already defines Cloudflare staging, but lacks a GitHub credential/deployment path.

[verified: session sign-in result and user report; specs/CLOUDFLARE-RUNTIME.md]

## Outcome

- Prepare a manual, main-only marketing staging deployment using the existing B4 Worker configuration.
- Document exact GitHub environment secret names and the subsequent API provisioning boundary.
- Return the credential-entry step to the operator without collecting secret values in chat.

## Constraints

- Existing canonical runtime architecture and product contracts govern.
- Use the existing B4 PR; preserve current marketing content and `/zzthis/` paths.
- No production deployment, domain purchase, DNS change, paid upgrade, or broadened feature scope.
- Credentials remain operator-managed GitHub environment secrets.

## Governing specification

`specs/CLOUDFLARE-RUNTIME.md`, `docs/cloudflare-resource-inventory.md`, and `docs/cloudflare-site-cutover.md` define the staging and migration requirements. This workflow implements the marketing staging portion only.

## Change map

- `.github/workflows/cloudflare-staging.yml`: manual verification and marketing staging deploy.
- `docs/cloudflare-github-connection.md`: operator authentication steps and scope.
- `package.json`: fix the existing marketing dry-run command to find Wrangler in the API workspace.
- This intent: session authorization and implementation boundary.

## Acceptance

- Workflow has no automatic or production trigger.
- Cloudflare credentials are present only in the deploy step.
- Validation precedes deploy and failures stop the job.
- Documentation distinguishes marketing deployment from API provisioning and production readiness.
- Remote deployment remains blocked until the operator adds the account credentials.
