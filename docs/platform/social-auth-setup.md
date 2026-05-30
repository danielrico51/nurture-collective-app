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

1. Copy `infrastructure/aws/cognito-social-auth.env.example` → `infrastructure/aws/cognito-social-auth.env`.
2. Add OAuth credentials from Google, Meta, and Apple (see sections below).
3. Run:

```bash
./infrastructure/aws/configure-cognito-social-auth.sh
```

The script creates or updates federated identity providers and enables them on the app client. **OAuth client secrets are not stored in the repo** — only in your local env file (gitignored).

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

Social sign-up may not collect custom attributes (`custom:username`, `phone_number`, `address`) on first login. Consider a post-sign-up profile step or mark those attributes optional for federated users.

## Code references

| File | Role |
|------|------|
| `src/config/socialAuth.ts` | Env flags and redirect URLs |
| `src/utils/amplifyConfig.ts` | Amplify `loginWith.oauth` |
| `src/components/Auth/SocialAuthButtons.tsx` | Sign-in / sign-up buttons |
| `src/app/(site)/(auth)/oauth/callback/page.tsx` | OAuth return handler |
| `src/lib/auth/socialSignIn.ts` | `signInWithRedirect` |

## Verify

1. Set env vars and restart `npm run dev`.
2. Open `/signup/mom` or `/signin` — Google / Facebook / Apple buttons should appear.
3. Complete a test sign-in; you should land on `/oauth/callback` then your member home path.

If buttons are hidden, check `NEXT_PUBLIC_SOCIAL_AUTH_ENABLED` and at least one `NEXT_PUBLIC_AUTH_*_ENABLED` flag.
