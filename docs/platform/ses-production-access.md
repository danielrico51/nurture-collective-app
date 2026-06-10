# AWS SES — production access (go-live)

Account: `886436941204` · Region: `us-east-1`

## Current status (check anytime)

```bash
aws sesv2 get-account --region us-east-1 \
  --query '{Production:ProductionAccessEnabled,Review:Details.ReviewDetails,Quota:SendQuota}'

aws sesv2 list-email-identities --region us-east-1
```

| Item | Expected for go-live |
|------|----------------------|
| `ProductionAccessEnabled` | `true` |
| `ReviewDetails.Status` | `GRANTED` (not `DENIED` or `PENDING`) |
| Domain `nesting-place.com` | `VerificationStatus: SUCCESS`, DKIM `SUCCESS` |
| MAIL FROM `info.nesting-place.com` | `MailFromDomainStatus: SUCCESS` |
| Amplify `GIFT_CARD_EMAIL_FROM` | `info@nesting-place.com` |
| IAM `ses:SendEmail` | On `nurture-collective-amplify-server` (inline `NurtureSESSendGiftCards`) and `NurtureCollectiveAmplifyComputePolicy` |

**Sandbox limits until production is granted:** 200 emails/day, 1/sec, recipients must be verified identities only.

## IAM (application can send)

Amplify SSR uses `SERVER_AWS_ACCESS_KEY_ID` → IAM user `nurture-collective-amplify-server` with inline policy `NurtureSESSendGiftCards`.

Also update the shared compute policy (role fallback):

```bash
chmod +x infrastructure/aws/scripts/apply-amplify-compute-live-policy.sh
./infrastructure/aws/scripts/apply-amplify-compute-live-policy.sh
```

## Request production access (re-apply after denial)

### CLI (when AWS allows a new submission)

After a **DENIED** case, `put-account-details` often returns `ConflictException` until AWS clears the lock or you appeal via the console. When re-submission works, use:

```bash
aws sesv2 put-account-details \
  --region us-east-1 \
  --production-access-enabled \
  --mail-type TRANSACTIONAL \
  --website-url "https://nesting-place.com/" \
  --contact-language EN \
  --additional-contact-email-addresses info@nesting-place.com danielrico51@gmail.com \
  --use-case-description "$(cat <<'EOF'
The Nesting Place (operated by Nurture Collective LLC) sends transactional email only through Amazon SES. We do not send marketing newsletters or purchased lists.

Email types:
1. eGift card delivery — After a customer completes Stripe checkout on nesting-place.com, we email the gift recipient their card details and optional personal message. The purchaser may receive a copy if they opt in on the form.
2. Fulfillment notification — Our team receives an order summary at info@nesting-place.com for each paid gift card.
3. Transactional follow-up — Rare operational messages tied to an existing customer inquiry (contact form or care coordination), not bulk campaigns.

Recipient consent:
- Gift card purchasers explicitly enter the recipient email and complete payment.
- Contact form includes a required, unchecked-by-default SMS/email consent checkbox before submit.

Sending identity:
- Verified domain: nesting-place.com (DKIM enabled, MAIL FROM info.nesting-place.com).
- From address: info@nesting-place.com (display name: The Nesting Place).

Bounce and complaint handling:
- SES account suppression list is enabled for bounces and complaints.
- We monitor sending through AWS and will pause if complaint rates rise.

Expected volume:
- Launch: under 500 transactional emails per month.
- Growth: under 5,000 per month in the first year.

We previously received a denial (case 178070039500921). Domain verification, DKIM, custom MAIL FROM, and Mail Manager inbound policies are now fully configured. We request production access to deliver gift cards and inquiry confirmations to customers who are not on a verified-address list.
EOF
)"
```

Verify status:

```bash
aws sesv2 get-account --region us-east-1 \
  --query '{Production:ProductionAccessEnabled,Review:Details.ReviewDetails}'
```

**If you get `ConflictException`:** AWS still has case `178070039500921` in `DENIED` state and blocks new API submissions. Use the console steps below or [AWS Support case history](https://support.console.aws.amazon.com/support/home?region=us-east-1#/case/history) to submit an appeal.

### Console (preferred after a denial)

1. Open [SES Account dashboard](https://console.aws.amazon.com/ses/home?region=us-east-1#/account).
2. Click **Request production access** (or **Submit appeal** on case `178070039500921` if shown).
3. Paste the use case below (edit volume numbers if needed).
4. Allow **3–5 business days** (sometimes longer). Plan a sandbox fallback test before launch.

### Suggested form answers

**Mail type:** Transactional

**Website URL:** `https://nesting-place.com`

**Use case description (paste):**

```
The Nesting Place (operated by Nurture Collective LLC) sends transactional email only through Amazon SES. We do not send marketing newsletters or purchased lists.

Email types:
1. eGift card delivery — After a customer completes Stripe checkout on nesting-place.com, we email the gift recipient their card details and optional personal message. The purchaser may receive a copy if they opt in on the form.
2. Fulfillment notification — Our team receives an order summary at info@nesting-place.com for each paid gift card.
3. Transactional follow-up — Rare operational messages tied to an existing customer inquiry (contact form or care coordination), not bulk campaigns.

Recipient consent:
- Gift card purchasers explicitly enter the recipient email and complete payment.
- Contact form includes a required, unchecked-by-default SMS/email consent checkbox before submit.

Sending identity:
- Verified domain: nesting-place.com (DKIM enabled, MAIL FROM info.nesting-place.com).
- From address: info@nesting-place.com (display name: The Nesting Place).

Bounce and complaint handling:
- SES account suppression list is enabled for bounces and complaints.
- We monitor sending through AWS and will pause if complaint rates rise.

Expected volume:
- Launch: under 500 transactional emails per month.
- Growth: under 5,000 per month in the first year.

We previously received a denial (case 178070039500921). Domain verification, DKIM, and custom MAIL FROM are now fully configured. We request production access to deliver gift cards and inquiry confirmations to customers who are not on a verified-address list.
```

**Additional contacts:** `info@nesting-place.com`, `danielrico51@gmail.com`

**Compliance:** Confirm you only send to recipients who have requested or purchased your service.

## After approval

1. Verify production:

   ```bash
   aws sesv2 get-account --region us-east-1 --query ProductionAccessEnabled
   ```

2. Send a real test on dev (small Stripe gift card) to a **personal non-team Gmail** — confirm inbox delivery.

3. Optional CLI test:

   ```bash
   export GIFT_CARD_EMAIL_ENABLED=true
   export GIFT_CARD_EMAIL_FROM=info@nesting-place.com
   export TEST_INBOX=your-test@gmail.com
   npm run test:gift-card-email
   ```

4. Redeploy Amplify **main** before public launch if env vars changed.

## Mail Manager (inbound) — separate from production access

The SES console **Mail Manager** checklist (traffic policy, rule set, ingress endpoint) is for **receiving** email into AWS, not for **sending** gift cards or transactional mail. Completing it does **not** remove sandbox limits or overturn a production-access denial.

**Already provisioned (account `886436941204`, `us-east-1`):**

| Resource | ID / name |
|----------|-----------|
| Traffic policy | `nesting-place-inbound-policy` → `tp-jbkyeoaxdjknaf7mhg7ibeji` |
| Rule set | `nesting-place-inbound-rules` → `rs-ia5enogsat6pjman7yz4zjpq` |
| Ingress endpoint | `nesting-place-inbound` → `inp-qlsph3rra4jnjykxinmcgmqj` |
| Ingress A record | `iezizsmedinq.fips.wmjb.mail-manager-smtp.amazonaws.com` |

Re-run idempotently:

```bash
chmod +x infrastructure/aws/scripts/setup-ses-mail-manager-inbound.sh
./infrastructure/aws/scripts/setup-ses-mail-manager-inbound.sh
```

**Do not** point `nesting-place.com` MX at Mail Manager unless you want AWS (not Google Workspace) to receive `info@` mail. The current rule set only adds a processing header; add `WriteToS3` or `Relay` rules when you need delivery.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `MessageRejected` / not verified | Still in sandbox |
| `AccessDenied` on SendEmail | Missing IAM `ses:SendEmail` on server user or compute policy |
| Email not received, no error | Spam folder; DMARC/SPF — confirm DKIM + MAIL FROM still SUCCESS |
| Only fulfillment email works | Recipient address not verified (sandbox) |
