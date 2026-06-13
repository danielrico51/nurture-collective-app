# Cognito verification email (Resend interim)

Member sign-up and password-reset codes are sent by **Amazon Cognito**. By default Cognito uses a generic AWS sender (`COGNITO_DEFAULT`), which often lands in spam.

Until **SES production access** is granted, route Cognito auth emails through **Resend** using a **Custom Email Sender** Lambda.

## How it works

```text
User signs up at /signup
  → Cognito encrypts verification code (KMS)
  → Lambda decrypts code
  → Resend delivers from info@nesting-place.com
```

Cognito stops sending its own email once the custom sender is active.

## One-time setup

1. Verify **nesting-place.com** (or your from-address) at [resend.com/domains](https://resend.com/domains) — same as gift cards.
2. Set `RESEND_API_KEY` in Amplify (already used for gift cards) or copy `infrastructure/aws/cognito-resend-email.env.example` → `cognito-resend-email.env`.
3. Deploy:

```bash
npm run setup:cognito-resend-email
```

## Verify

1. Sign up with a new email at `/signup`.
2. Code should arrive from **The Nesting Place &lt;info@nesting-place.com&gt;** (via Resend).
3. Check Lambda logs: `/aws/lambda/nurture-cognito-custom-email-resend`.

## Switch to SES later

When SES production is **GRANTED**:

1. Configure Cognito `EmailSendingAccount=DEVELOPER` with `nesting-place.com` (see SES docs).
2. Remove the custom sender from the pool (keep `PreSignUp` if Google sign-up placeholders are still needed):

```bash
npm run setup:cognito-federated-presignup
# or merge manually — never set --lambda-config to only one trigger
```

**Important:** `aws cognito-idp update-user-pool --lambda-config` replaces the entire Lambda trigger set. Always use `npm run setup:cognito-resend-email` / `setup:cognito-federated-presignup` so PreSignUp and CustomEmailSender stay merged.

Both deploy scripts also set `--auto-verified-attributes email`. **Never** run a bare `update-user-pool` with only one flag — Cognito clears the other settings (Lambda triggers or auto-verify).

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| No email in Resend; Lambda never invoked | `AutoVerifiedAttributes` missing `email`, or `CustomEmailSender` was wiped from `LambdaConfig` |
| `Cannot resend codes. Auto verification not turned on.` | Pool needs `--auto-verified-attributes email` |
| Resend API succeeds but no inbox delivery | Check spam; same-domain (`info@` → `operations@`) may route internally — check Resend dashboard for “delivered” |
| Stuck `UNCONFIRMED` user from before fix | Re-sign up, or wait for rate limit then resend; account must be **enabled** (`Enabled: true`) |

Restore full pool email config in one command:

```bash
source infrastructure/aws/scripts/lib/merge-cognito-lambda-config.sh
lambda_config="$(merge_cognito_lambda_config us-east-1_rUfTimytf us-east-1)"
aws cognito-idp update-user-pool \
  --user-pool-id us-east-1_rUfTimytf \
  --auto-verified-attributes email \
  --lambda-config "$lambda_config" \
  --region us-east-1
```

## Related

- Gift card Resend setup: `docs/platform/gift-cards-payments.md`
- SES production request: `docs/platform/ses-production-access.md`
- Google sign-up: no email code (federated) — `docs/platform/social-auth-setup.md`
