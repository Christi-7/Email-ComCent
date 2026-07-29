# Email Command Center

A review-and-authorize inbox interface powered by your **OnDemand** agent.

The agent reads your inbox, categorizes emails by organization, and drafts reply
suggestions. You review and edit each one, and **nothing is sent until you click
"Authorize & send"** — the agent never sends on its own.

## How it's put together

```
┌──────────────┐     /api/*      ┌──────────────┐   chat API    ┌───────────────┐
│  Frontend    │ ─────────────▶  │  Proxy        │ ───────────▶  │  OnDemand     │
│ (index.html) │  ◀───────────── │ (serverless)  │  ◀─────────── │  agent        │
└──────────────┘                 └──────────────┘               └───────────────┘
     browser                     holds API key                  reads/sends email
```

- **`public/index.html`** — the UI. Calls `/api/*` only. Holds no secrets.
- **`api/_ondemand.js`** — the OnDemand client (create session → submit query),
  refactored from the original Python script. Reads the API key from an env var.
- **`api/emails.js`** — `GET`: asks the agent for categorized emails as JSON.
- **`api/regenerate.js`** — `POST`: asks the agent to redraft one reply.
- **`api/send.js`** — `POST`: the only path that sends. Runs on your click.

Your OnDemand API key stays **server-side** in the proxy. It is never exposed to
the browser — which is why this is not a pure static site.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. In [vercel.com](https://vercel.com), "Add New Project" → import the repo.
3. Under **Settings → Environment Variables**, add:
   - `ONDEMAND_API_KEY` — your OnDemand key
   - `ONDEMAND_AGENT_IDS` — e.g. `agent-1741770626`
   - `ONDEMAND_ENDPOINT_ID` — e.g. `predefined-claude-4-8-opus`
4. Deploy. Vercel serves `public/index.html` and turns each file in `api/`
   into a serverless function automatically.

## Local dev

```bash
npm i -g vercel
cp .env.example .env.local   # fill in real values
vercel dev
```

## Important: the agent's output contract

For the UI to group and draft correctly, `api/emails.js` asks the agent to return
a JSON array where each item has:

```json
{
  "id": "unique-string",
  "from": "Sender Name",
  "fromEmail": "sender@example.com",
  "org": "Organization",
  "subject": "Subject line",
  "body": "Plain-text body",
  "receivedAt": "2026-07-09T08:00:00Z",
  "suggestedReply": "Draft reply text"
}
```

The proxy tolerates the agent wrapping this in prose or code fences, but the
cleaner the agent's JSON output, the more reliable the app. If your agent needs
email access configured on the OnDemand side, set that up there — this app drives
the agent through the chat API only.

## Security notes

- **Rotate your API key** if it was ever committed or shared in plain text.
- `.env` files are gitignored. Keep real keys out of the repo.
- The app is set `"public": false` in `vercel.json`; add auth in front of it
  before using with a real inbox.
