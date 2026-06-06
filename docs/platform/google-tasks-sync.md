# Google Tasks sync — internal task board

Two-way sync between `/admin/tasks` and **Google Tasks** for **internal** tasks only.

**GCP project:** `boxwood-magnet-498623-n4`

## Important: Google Tasks cannot be shared via API

Google removed shared task lists in 2022. The Tasks API has **no endpoint** to share a list with other users. “Shared tasks” in Google only exist inside **Chat spaces** or **Docs**, and those cannot be created from the Tasks API.

**Team sharing lives in the app** (`/admin/tasks` — same S3 board for all management users). Google Tasks is an optional **personal mirror** for each teammate.

## Recommended flow — personal sync (team-friendly)

Each team member clicks **Connect Google Tasks** on the task board. The app:

1. Stores their OAuth refresh token (encrypted in S3 with other management data)
2. Mirrors internal team tasks into **their own** “Nesting Place Tasks” list at [tasks.google.com](https://tasks.google.com)
3. Keeps two-way sync for that user only

| Direction | How |
|-----------|-----|
| App → Google | Automatic on create/update/delete (for every connected user) |
| Google → App | Auto-pull on board load + **Sync from Google** button |

### CLI setup (one command after OAuth client exists)

Google does **not** allow creating OAuth Web clients via `gcloud` — that one step is in Console (link printed by the script). Everything else is automated:

```bash
# 1) Create Web OAuth client once (Console — script prints this URL):
#    https://console.cloud.google.com/auth/clients/create?project=boxwood-magnet-498623-n4
#    Redirect URIs:
#      http://localhost:3000/api/tasks/google/callback
#      https://dev.d9588bqvrp5xs.amplifyapp.com/api/tasks/google/callback

# 2) Run full CLI setup (GCP API, .env.local, Amplify env, redeploy):
export GOOGLE_TASKS_OAUTH_CLIENT_ID='....apps.googleusercontent.com'
export GOOGLE_TASKS_OAUTH_CLIENT_SECRET='....'
npm run setup:personal-google-tasks
```

Or interactively (script prompts for client ID/secret):

```bash
npm run setup:personal-google-tasks
```

### Per-team-member connect (by email)

Each person signs into the app with their Cognito/Workspace email, then clicks **Connect Google Tasks**. The app stores their token keyed by that email and syncs to **their** Google Tasks list. No manual email mapping — login email is the link.

## Legacy flow — single admin list (not team-shareable)

One Workspace user (`admin@nesting-place.com`) owns the list. Useful for a single operator; other users will not see tasks in Google unless manually shared in the UI (limited).

```env
GOOGLE_TASKS_SYNC_MODE=legacy
GOOGLE_TASKS_AUTH_MODE=delegated
GOOGLE_TASKS_DELEGATED_USER=admin@nesting-place.com
```

See `infrastructure/aws/scripts/set-amplify-google-tasks-env.sh` for delegated Amplify setup.

## CLI

```bash
npm run migrate:tasks-to-google
ACTION=pull npm run migrate:tasks-to-google
```

Client tasks still sync to ClickUp via n8n — not Google Tasks.
