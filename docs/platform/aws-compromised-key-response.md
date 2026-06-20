# AWS compromised key — incident response

Account: **886436941204** · Amplify app: **d9588bqvrp5xs** · IAM user: **nurture-collective-amplify-server**

## Safe admin CLI profile

Use an IAM user with MFA (e.g. `danielrico`), **not** root access keys:

```bash
chmod +x infrastructure/aws/scripts/setup-admin-aws-profile.sh
./infrastructure/aws/scripts/setup-admin-aws-profile.sh nurture
export AWS_PROFILE=nurture
export AWS_REGION=us-east-1
aws sts get-caller-identity   # should show arn:...:user/danielrico
```

Existing profile `nurture` → IAM user `danielrico` is suitable for incident response if it has IAM/Amplify permissions.

## Rotate SERVER_AWS keys (Amplify SSR)

```bash
export AWS_PROFILE=nurture
chmod +x infrastructure/aws/scripts/rotate-amplify-server-access-key.sh
./infrastructure/aws/scripts/rotate-amplify-server-access-key.sh
```

This script:

1. Creates a new key on `nurture-collective-amplify-server`
2. Updates `SERVER_AWS_*` on Amplify app + `dev` + `main` branches
3. Starts redeploy jobs on `dev` and `main`
4. Deactivates the exposed key (default `AKIA44Y6CJWKANL3LQMS`)
5. Saves the new secret once to `~/.nurture-amplify-server-key.json` (delete after redeploy)

After 24–48h stable:

```bash
aws iam delete-access-key \
  --user-name nurture-collective-amplify-server \
  --access-key-id AKIA44Y6CJWKANL3LQMS
```

## Long-term: remove static keys

Remove `SERVER_AWS_ACCESS_KEY_ID` and `SERVER_AWS_SECRET_ACCESS_KEY` from Amplify and use the compute role only:

```bash
./infrastructure/aws/scripts/attach-amplify-s3-policy.sh dev NurtureCollectiveAmplifyComputeRole
./infrastructure/aws/scripts/apply-amplify-compute-live-policy.sh
```

Then delete all access keys on `nurture-collective-amplify-server`.

## Audit commands

```bash
export AWS_PROFILE=nurture AWS_REGION=us-east-1

# IAM users
aws iam list-users

# Access keys per user
for u in $(aws iam list-users --query 'Users[].UserName' --output text); do
  echo "=== $u ==="
  aws iam list-access-keys --user-name "$u"
done

# Recent IAM changes
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=CreateUser --max-results 20
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=CreateAccessKey --max-results 20

# EC2 (repeat --region for each region you use)
aws ec2 describe-instances --region us-east-1
aws ec2 describe-instances --region us-east-2
```

## AWS Support reply template

See the Support Case reply in the team runbook or copy from the incident chat — confirm key rotation, CloudTrail review, billing review, and MFA enabled.
