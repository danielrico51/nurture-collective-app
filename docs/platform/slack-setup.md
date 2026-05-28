# Slack — dev setup (free workspace)

Wire Nurture Collective intake & conversion notifications to a **free Slack workspace** for development.

Mapped to [process-flow.md](./process-flow.md):

| Event | Slack channel (dev default) | Trigger |
|-------|----------------------------|---------|
| `lead.created` | `#dev-new-leads` | Guest/member shares name + email or phone in AI intake |
| `intake.completed` | `#dev-new-leads` | User explicitly completes intake |
| `consult.booked` | `#dev-scheduled-calls` | Calendly webhook `invitee.created` |
| Status → consult / proposal / converted | `#dev-scheduled-calls` / `#dev-operations` | Coordinator updates Lead CRM |
| Status → lost / stale | `#dev-lost-leads` | Coordinator marks lead lost or stale |

---

## 1. Create channels in your free workspace

In Slack, create (names are flexible):

- `dev-new-leads`
- `dev-scheduled-calls`
- `dev-operations` (optional for Sprint 2+)
- `dev-lost-leads` (optional)

---

## 2. Create the Slack app

### Which path?

| Goal | Use |
|------|-----|
| **Fastest dev setup** (webhooks only) | **From scratch** — no manifest needed |
| **One-shot setup** with correct bot scopes for later (slash commands, multi-channel bot) | **From manifest** — paste our file |

Incoming webhooks **cannot** be turned on via the manifest — you toggle that once in the app settings after creation (either path).

### Option A — From scratch (webhooks only, ~3 min)

Best if you only want `SLACK_WEBHOOK_*` URLs and no bot token.

1. [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Name: `Nurture Collective Dev`, pick your workspace
3. **Incoming Webhooks** → turn **On**
4. **Add New Webhook to Workspace** → pick `#dev-new-leads` → copy URL
5. Repeat for `#dev-scheduled-calls` (and others if desired)

Skip to [section 3 — env vars](#3-add-env-vars) below.

### Option B — From manifest (recommended)

Pre-configures the bot with `chat:write` scopes (needed for `SLACK_BOT_TOKEN` and future slash commands).

1. [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From an app manifest**
2. Pick your free workspace
3. Paste contents of [`slack-app-manifest.yaml`](./slack-app-manifest.yaml) or [`slack-app-manifest.json`](./slack-app-manifest.json)
4. **Create** → review permissions → **Install to Workspace**
5. **Still do manually** (Slack does not allow these in the manifest):
   - **Incoming Webhooks** → **On** → add webhook for `#dev-new-leads`, `#dev-scheduled-calls`, etc.
   - **OAuth & Permissions** → copy **Bot User OAuth Token** (`xoxb-...`) if using bot mode
   - In each channel: `/invite @Nurture Collective Dev` (only if using bot token without webhooks)

You can use **webhooks only**, **bot only**, or **both** (webhooks win per channel when set).

---

## 3. Add env vars

### Webhooks (works with either Option A or B)

```bash
SLACK_ENABLED=true
NEXT_PUBLIC_APP_URL=http://localhost:3000

SLACK_WEBHOOK_NEW_LEADS=https://hooks.slack.com/services/T.../B.../...
SLACK_WEBHOOK_SCHEDULED_CALLS=https://hooks.slack.com/services/T.../B.../...
# Optional:
# SLACK_WEBHOOK_OPERATIONS=...
# SLACK_WEBHOOK_LOST_LEADS=...
```

### Bot token (Option B only, or skip if using webhooks alone)

```bash
SLACK_ENABLED=true
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_NEW_LEADS=dev-new-leads
SLACK_CHANNEL_SCHEDULED_CALLS=dev-scheduled-calls
SLACK_CHANNEL_OPERATIONS=dev-operations
SLACK_CHANNEL_LOST_LEADS=dev-lost-leads
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Webhooks take precedence when both are set for a channel.

---

## 4. Test locally

1. Restart dev server after updating `.env.local`
2. Sign in as admin → POST test (or use curl):

```bash
curl -X POST http://localhost:3000/api/admin/slack/test \
  -H "Authorization: Bearer YOUR_COGNITO_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"channel":"newLeads"}'
```

3. Complete public intake at `/intake` with name + email → message in `#dev-new-leads`
4. For Calendly: register webhook URL `https://YOUR_NGROK/api/webhooks/calendly` in Calendly → book a test call

---

## 5. Calendly webhook (consult.booked)

In Calendly → Integrations → Webhooks:

- URL: `https://<your-dev-host>/api/webhooks/calendly`
- Events: **Invitee created**
- Signing key → `CALENDLY_WEBHOOK_SIGNING_KEY` in env

---

## 6. Production notes

- Use separate channels (`#new-leads`, `#scheduled-calls`) and a **production Slack app**
- Never commit webhook URLs or bot tokens
- PHI-minimal: only name, stage, score, and admin links — no full chat transcripts in Slack ([architecture.md](./architecture.md))
- `SLACK_ENABLED=false` by default until explicitly enabled

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No messages | Confirm `SLACK_ENABLED=true` and webhook URL or bot token |
| `channel_not_found` (bot) | `/invite @YourBot` in the channel |
| `not_in_channel` | Bot must be invited to private channels |
| Calendly silent | Check webhook delivery log; verify ngrok/public URL |
| Duplicate new-lead pings | Only fires when contact info is **first** captured, not every chat message |
