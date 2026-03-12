# sloppypaste.com

A small single-page site explaining "sloppypasting": pasting raw AI output into a conversation without first reading it, trimming it, or pointing at the part that matters.

## Stack

- Static HTML + CSS for fast first load
- Cloudflare Workers for hosting
- SST v4 for deployment and domain wiring

## Local usage

1. Install dependencies with `npm install`.
2. Authenticate SST against your Cloudflare account.
3. Run `npm run dev`.

## Deploy

Run `npm run deploy`.

Production deploys attach the Worker to `sloppypaste.com`. Non-production stages get their own generated URL.

## GitHub Actions deploy

The repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

It deploys the `production` stage when you push to `main`, and it also supports manual runs from the Actions tab.

Add these repository secrets before using it:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_DEFAULT_ACCOUNT_ID`

The token needs Cloudflare permissions that can deploy Workers and edit the DNS zone for `sloppypaste.com`.
