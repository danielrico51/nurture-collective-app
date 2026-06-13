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
2. Remove the custom sender from the pool:

```bash
aws cognito-idp update-user-pool \
  --user-pool-id us-east-1_rUfTimytf \
  --region us-east-1 \
  --lambda-config PreSignUp=arn:aws:lambda:us-east-1:886436941204:function:nurture-cognito-federated-presignup
```

(Keep `PreSignUp` if you still need federated Google sign-up placeholders.)

## Related

- Gift card Resend setup: `docs/platform/gift-cards-payments.md`
- SES production request: `docs/platform/ses-production-access.md`
- Google sign-up: no email code (federated) — `docs/platform/social-auth-setup.md`
