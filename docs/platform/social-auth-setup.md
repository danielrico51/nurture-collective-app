# Social sign-in (Google, Facebook, Apple)

Member sign-up and sign-in support federated providers through **Amazon Cognito Hosted UI** and **Amplify Auth**.

## App configuration

Set these in `.env.local` (dev) and **Amplify Console → Environment variables** (production), then redeploy:

```env
NEXT_PUBLIC_APP_URL=https://your-app.example.com
NEXT_PUBLIC_COGNITO_DOMAIN=us-east-1ruftimytf.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_SOCIAL_AUTH_ENABLED=true
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true
NEXT_PUBLIC_AUTH_FACEBOOK_ENABLED=true
NEXT_PUBLIC_AUTH_APPLE_ENABLED=true
```

`NEXT_PUBLIC_APP_URL` must match the site origin (no trailing slash). OAuth redirects use `{APP_URL}/oauth/callback`.

## Cognito User Pool

Pool: `us-east-1_rUfTimytf`  
App client: `4t0uapt8havig5h7jiio9g9os4`  
Hosted UI domain: `us-east-1ruftimytf` → full domain `us-east-1ruftimytf.auth.us-east-1.amazoncognito.com`

### Automated setup (recommended)

1. Ensure a **Web application** OAuth client exists in [Google Cloud → Auth → Clients](https://console.cloud.google.com/auth/clients?project=boxwood-magnet-498623-n4) for project `boxwood-magnet-498623-n4`.
   - Google does **not** expose standard OAuth Web Client create/list via `gcloud` (only Console or IAP/workforce APIs).
   - Reuse an existing Web client or create one named e.g. `Nesting Place Cognito`.
2. On that OAuth client, add **Authorized redirect URI**:
   `https://us-east-1ruftimytf.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
3. Put credentials in `infrastructure/aws/cognito-social-auth.env` **or** set `GOOGLE_COGNITO_CLIENT_ID` / `GOOGLE_COGNITO_CLIENT_SECRET` in `.env.local` (the setup script can also reuse `GOOGLE_TASKS_OAUTH_*` as a fallback).
4. Run:

```bash
npm run setup:cognito-google
# or: ./infrastructure/google/setup-cognito-google-oauth.sh
```

The script writes `cognito-social-auth.env` (gitignored), creates/updates the **Google** identity provider in Cognito, and enables **Google** on the app client. **OAuth client secrets are not stored in the repo.**

**Cognito Google federation fields (if configuring in Console manually):**

| Field | Value |
|-------|--------|
| Client ID | From Google Web OAuth client |
| Client secret | From same client |
| Authorized scopes | `profile email openid` |

**Amplify Gen 2 (optional):** `amplify/auth/resource.ts` declares the same providers using `npx ampx sandbox secret set GOOGLE_CLIENT_ID` (and related secrets) before `npx ampx sandbox deploy`.

### 1. Callback and sign-out URLs

In **Cognito → App integration → App client → Hosted UI**, add:

| Type | URLs |
|------|------|
| Callback | `http://localhost:3000/oauth/callback` |
| Callback | `https://<your-amplify-domain>/oauth/callback` |
| Sign-out | `http://localhost:3000/` |
| Sign-out | `https://<your-amplify-domain>/` |

Allowed OAuth flows: **Authorization code grant**.  
Scopes: `openid`, `email`, `profile` (and `phone` if needed).

### 2. Identity providers

In **Cognito → Sign-in experience → Federated identity provider sign-in**, add each provider:

#### Google

1. Create OAuth client in [Google Cloud Console](https://console.cloud.google.com/) (Web application).
2. Authorized redirect URI:  
   `https://us-east-1ruftimytf.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
3. Copy Client ID and Client secret into Cognito **Google** provider.

#### Facebook

1. Create app in [Meta for Developers](https://developers.facebook.com/).
2. Add Facebook Login → Valid OAuth Redirect URIs: same Cognito `.../oauth2/idpresponse` URL.
3. Copy App ID and App secret into Cognito **Facebook** provider.

#### Apple

1. Configure **Sign in with Apple** in [Apple Developer](https://developer.apple.com/account/).
2. Services ID redirect URL: same Cognito `.../oauth2/idpresponse` URL.
3. Add **SignInWithApple** provider in Cognito with Team ID, Key ID, private key, and Services ID.

### 3. App client identity providers

On the app client, enable **Google**, **Facebook**, and **SignInWithApple** under supported identity providers (in addition to **Cognito**).

### 4. Attribute mapping

Map federated attributes to user pool attributes as needed:

- `email` → `email`
- `given_name` → `given_name`
- `family_name` → `family_name`

Social sign-up may not collect custom attributes (`custom:username`, `phone_number`, `address`) on first login — Google only sends `profile email openid` by default. A **PreSignUp Lambda** injects placeholders so Cognito can create the user; the app then sends members to `/signup/complete-profile` to collect phone and address.

Deploy the Lambda once per pool:

```bash
npm run setup:cognito-federated-presignup
```

Cognito also requires `phone_number` and `address` in the Google IdP attribute mapping. Google does not send those claims, so the mapping uses `phone_number=sub` and `address=email` as placeholders; the PreSignUp Lambda replaces them before the user is created.

## Code references

| File | Role |
|------|------|
| `src/config/socialAuth.ts` | Env flags and redirect URLs |
| `src/utils/amplifyConfig.ts` | Amplify `loginWith.oauth` |
| `src/components/Auth/SocialAuthButtons.tsx` | Sign-in / sign-up buttons |
| `src/app/(site)/(auth)/oauth/callback/page.tsx` | OAuth return handler |
| `src/app/(site)/(auth)/signup/complete-profile/page.tsx` | Federated profile completion |
| `src/lib/auth/federatedProfile.ts` | Placeholder detection after social sign-in |
| `infrastructure/aws/scripts/deploy-cognito-federated-presignup.sh` | PreSignUp Lambda for required attrs |
| `src/lib/auth/socialSignIn.ts` | `signInWithRedirect` |

## Verify

1. Set env vars and restart `npm run dev`.
2. Open `/signup/mom` or `/signin` — Google / Facebook / Apple buttons should appear.
3. Complete a test sign-in; you should land on `/oauth/callback` then your member home path.

If buttons are hidden, check `NEXT_PUBLIC_SOCIAL_AUTH_ENABLED` and at least one `NEXT_PUBLIC_AUTH_*_ENABLED` flag.
