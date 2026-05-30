# SMS Concierge (Twilio)

Inbound texts to **(844) 926-2867** are handled by the same AI concierge as web chat.

## Flow

```text
Mom texts toll-free number
  → Twilio POST /api/webhooks/twilio/sms
  → Validate X-Twilio-Signature
  → STOP/START/HELP keywords (compliance)
  → resumeOrCreateSession (guest_sms_<phone>)
  → processConversationMessage (smsMode)
  → TwiML <Message> reply
```

Sessions, lead sync, and intake completion reuse `src/lib/conversation/engine.ts`.

## Environment (Amplify + `.env.local`)

| Variable | Purpose |
|----------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account |
| `TWILIO_AUTH_TOKEN` | Webhook signature + API |
| `TWILIO_PHONE_NUMBER` | `+18449262867` |
| `TWILIO_SMS_WEBHOOK_URL` | Exact public webhook URL (required behind Amplify proxy) |
| `OPENAI_API_KEY` | Concierge replies |
| `TWILIO_SKIP_SIGNATURE_VALIDATION=true` | Local dev only |

## Twilio Console setup

1. **Phone Numbers** → your toll-free number → **Messaging**
2. **A message comes in**: Webhook, `POST`, URL:
   `https://dev.d9588bqvrp5xs.amplifyapp.com/api/webhooks/twilio/sms`
3. Set the same URL in Amplify as `TWILIO_SMS_WEBHOOK_URL` (must match exactly for signature validation).

**Note:** n8n intake alerts also use this number for outbound team/mom SMS. Inbound concierge uses the app webhook above — both can share the same Twilio number (inbound → app, outbound → n8n).

## Compliance

- Mom-initiated texts imply conversational opt-in; `smsConsent` is set on the profile.
- `STOP` / `START` / `HELP` are handled before AI processing.
- Opt-outs are stored in `.data/sms/opt-outs.json` locally (S3 persistence can be added later).

## Local testing

```bash
# .env.local
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+18449262867
TWILIO_SKIP_SIGNATURE_VALIDATION=true

npm run dev
```

Use [ngrok](https://ngrok.com/) or similar to expose `/api/webhooks/twilio/sms` and point Twilio at the tunnel URL. Set `TWILIO_SMS_WEBHOOK_URL` to the ngrok URL when testing signatures.

## Trial accounts

Verify recipient phone numbers in Twilio Console before testing outbound replies from n8n. Inbound webhook replies work for any sender on paid accounts; trial may restrict destinations.
