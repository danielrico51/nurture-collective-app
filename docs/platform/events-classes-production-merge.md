# Events & Classes — production merge checklist

Use this when merging `dev` → `main` so class booking, payments, emails, and calendar sync work on **www.nesting-place.com**.

## Git status (as of prep)

- `dev` is **ahead of `main`** with the Events & Classes feature set (no merge conflicts expected with current `main`).
- `main` already includes today's lead CRM merge on `dev` (`b249abd`).

### Merge command (when ready)

```bash
git checkout main
git pull origin main
git merge origin/dev
git push origin main
```

Amplify will build `main` with `APP_ENV=prod` automatically (`amplify.yml` uses `AWS_BRANCH=main`).

## Storage isolation (important)

| Branch | Events JSON | Registrations |
|--------|-------------|---------------|
| **main** | `management/events/items.json` | `class-registrations/` |
| **dev** | `management/events/dev/items.json` | `class-registrations/dev/` |

Dev test classes **do not** appear on production until you create or publish them in **production admin**. After merge, publish listings on the live site admin.

## Amplify env vars — main branch

Run before or right after merge:

```bash
AMPLIFY_BRANCH=main ./infrastructure/aws/scripts/set-amplify-class-registration-env.sh
```

This sets (or confirms) on **main**:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLASS_REGISTRATION_PAYMENTS_ENABLED` | Show payment options on register form |
| `NEXT_PUBLIC_CLASS_REGISTRATION_STRIPE_ENABLED` | Card checkout (needs `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_GIFT_CARD_PAYMENTS_ENABLED`) |
| `NEXT_PUBLIC_CLASS_REGISTRATION_VENMO_HANDLE` | Venmo option (`@thenestingplace`) |
| `CLASS_REGISTRATION_VENMO_HANDLE` | Server-side Venmo label |
| `CLASS_REGISTRATION_EMAIL_ENABLED` | Confirmation emails to registrant + instructor |
| `CLASS_REGISTRATION_ADMIN_EMAIL` | Team copy of new registrations |
| `CLASS_REGISTRATION_PROVIDER_ACCESS_SECRET` | Signed instructor roster magic links |
| `CLASS_EVENTS_GOOGLE_CALENDAR_ID` | Classes calendar (separate from lead-call `GOOGLE_CALENDAR_ID`) |
| `CLASS_EVENTS_CALENDAR_SYNC_ENABLED` | Admin calendar sync tab |

**Already on main** (reuse — no change needed):

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_GIFT_CARD_PAYMENTS_ENABLED=true`
- `GIFT_CARD_EMAIL_*`, `RESEND_API_KEY` (registration emails)
- `GOOGLE_CALENDAR_*` / WIF (calendar API auth)
- `TASKS_S3_BUCKET`, `SERVER_AWS_*`, Cognito admin group

**Do not set on main:** `APP_ENV=dev` — main must stay `prod` scope.

## Stripe webhook (production)

Add or confirm endpoint in [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks):

- **URL:** `https://www.nesting-place.com/api/webhooks/stripe`
- **Event:** `checkout.session.completed`
- Handles `orderType: class_registration` and gift card orders.

Use the same `STRIPE_WEBHOOK_SECRET` already in Amplify **or** create a dedicated endpoint and update the secret on main.

## Google Calendar (classes)

1. Calendar ID (default): `CLASS_EVENTS_GOOGLE_CALENDAR_ID` — see `amplify.yml` / `.env.example`.
2. Share that calendar with **admin@nesting-place.com** with **Make changes to events** (delegated user, not the service account email).
3. Lead-call calendar (`GOOGLE_CALENDAR_ID`) remains separate — do not use it for classes.

## IAM

Compute policy `NurtureCollectiveAmplifyComputePolicy` must allow `s3:ListBucket` on `class-registrations/*` under `nurture-collective-tasks`:

```bash
./infrastructure/aws/scripts/apply-amplify-compute-live-policy.sh
```

## Post-deploy verification

1. **Admin → Events & classes → Settings** — Email, Payments (Stripe + Venmo), Calendar should show **On**; Storage should show `Deployment: prod` and prod S3 paths.
2. Publish a test class (draft first) with **Online registration**, price, instructor email.
3. **View live** → register page shows pay options.
4. Complete a test registration; check Registrations tab and email delivery.
5. **Calendar** tab → sync event to classes calendar.
6. **Instructor roster link** → preview on production URL.

## Rollback

- Unpublish listings (Publish status → Draft) to hide from the site without deleting data.
- Registration data remains under `class-registrations/` in S3.
