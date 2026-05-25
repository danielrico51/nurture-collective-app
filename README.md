# The Nurture Collective

A Next.js marketing site and member portal for pre- and postpartum mom concierge support, powered by **AWS Amplify Gen 2** (Cognito email auth).

## Prerequisites

- Node.js 20+
- npm 9.8+
- AWS account (for Amplify sandbox or hosting)

## Local development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the Amplify sandbox** (creates Cognito User Pool in your AWS account)

   ```bash
   npx ampx sandbox
   ```

   When the sandbox finishes, note the **User Pool ID** and **User Pool Client ID** from the terminal output (or from `amplify_outputs.json` in the project root after sandbox runs).

3. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   NEXT_PUBLIC_AWS_REGION=us-east-1
   NEXT_PUBLIC_USER_POOL_ID=<from sandbox>
   NEXT_PUBLIC_USER_POOL_CLIENT_ID=<from sandbox>
   ```

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Auth flows

| Route | Description |
|-------|-------------|
| `/signup` | Create account (email verification code) |
| `/signin` | Sign in |
| `/dashboard` | Protected member area (requires sign-in) |
| `/admin` | Admin app hub (requires Cognito `admin` group) |
| `/admin/tasks` | Team task board |
| `/management/tasks` | Redirects to `/admin/tasks` |

After sign-in or sign-up, you are redirected to `/dashboard`.

## Admin workspace

Internal tools live under **`/admin`**. Only users in the Cognito **`admin`** group can access this section or its APIs.

Register new admin apps in `src/config/adminApps.ts`, then add a route under `src/app/(site)/admin/`.

### Task board

The task board is the first admin app at **`/admin/tasks`**.

Tasks are stored as JSON in **Amazon S3** (`TASKS_S3_BUCKET`). Without it, local dev falls back to `.data/management/tasks.json`.

Task assignees are loaded from the Cognito **`admin`** group (override with `MANAGEMENT_COGNITO_GROUP` if needed).

### Setup S3

1. Create a bucket (e.g. `nurture-collective-tasks-prod`) in the same region as Cognito.
2. Add to `.env.local` (and Amplify environment variables):

   ```env
   TASKS_S3_BUCKET=your-bucket-name
   MANAGEMENT_COGNITO_GROUP=admin
   NEXT_PUBLIC_MANAGEMENT_COGNITO_GROUP=admin
   ```

3. **Local dev:** grant your AWS profile `s3:GetObject` and `s3:PutObject` on `arn:aws:s3:::your-bucket-name/*` (or set `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in `.env.local`).

4. **Amplify Hosting:** attach an IAM policy to the app’s **Compute role** with:
   - `s3:GetObject` and `s3:PutObject` on `arn:aws:s3:::your-bucket-name/*`
   - `cognito-idp:ListUsersInGroup` on your user pool (for the `admin` group)

5. Add team members to the **`admin`** Cognito group in the AWS console. Users must **sign out and back in** after being added so their ID token includes `cognito:groups`.

6. Redeploy after adding env vars in Amplify.

## Build

```bash
npm run build
npm start
```

Cognito env vars must be set for auth pages to work. For CI/Amplify Hosting, set `NEXT_PUBLIC_AWS_REGION`, `NEXT_PUBLIC_USER_POOL_ID`, and `NEXT_PUBLIC_USER_POOL_CLIENT_ID` in the Amplify console (see `amplify.yml`).

## Deploy to Amplify Hosting

1. Push this repo to GitHub.
2. In [AWS Amplify Console](https://console.aws.amazon.com/amplify/), create a new app → **Host web app** → connect the repository.
3. Deploy the backend with Gen 2 pipeline or link an existing sandbox branch.
4. Add environment variables in **Hosting → Environment variables** (`NEXT_PUBLIC_*` Cognito values and `TASKS_S3_BUCKET`).
5. Redeploy.

## Project structure

```
amplify/          # Gen 2 backend (auth + data)
src/app/          # Next.js App Router pages
src/components/   # UI components
src/utils/        # Amplify client configuration
```

## Future expansion

- Cognito groups (`member`, `concierge`)
- Amplify Data models: care plans, bookings, intake forms
- OAuth (Google/Apple) via `defineAuth` external providers
- Booking, payments, and messaging integrations
