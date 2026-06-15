# Proposal library seed (dev)

Redacted style-reference entries derived from historical Nesting Place contracts.
**No client names, partner names, assigned doula names, or specific due dates** are stored.

## Contents

| `service_type` | Source pattern |
|----------------|----------------|
| `birth-doula` | In-person birth doula agreements (~$2,500–$2,800) |
| `birth-doula-virtual` | Virtual agreement format (~$2,300) |
| `postpartum-doula-intensive` | High-hour overnight package (~320 hours) |
| `postpartum-doula-overnight` | Carrot Fertility overnight package (~120 hours) |

Business payment handles (Venmo `@thenestingplace`, etc.) are retained as standard TNP contract language.

## Upload to S3

```bash
chmod +x infrastructure/aws/scripts/seed-proposal-library-s3.sh
./infrastructure/aws/scripts/seed-proposal-library-s3.sh
```

Target path (Amplify dev):

```
s3://nurture-collective-tasks/proposal-library/dev/{service_type}/proposal.json
```

## Regenerate from new contracts

1. Add redacted `ProposalLibraryEntry` objects to `entries.json`
2. Re-run the seed script
3. Do not commit raw `.docx` files to the repository
