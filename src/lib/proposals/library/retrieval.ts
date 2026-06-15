import "server-only";

import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import { proposalsStorageConfig } from "@/lib/proposals/config";
import {
  buildProposalLibraryPrefix,
  buildProposalLibraryProposalKey,
} from "@/lib/proposals/paths";
import { BUILTIN_PROPOSAL_LIBRARY } from "@/lib/proposals/library/builtin";
import type { ProposalContextPackage, ProposalLibraryEntry } from "@/types/proposal";

const getS3Client = () =>
  new S3Client({
    region:
      process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1",
    credentials: getServerCredentials(),
  });

const scoreLibraryEntry = (
  entry: ProposalLibraryEntry,
  context: ProposalContextPackage
): number => {
  let score = 0;
  const requested = new Set(
    [...context.services_requested, ...context.recommended_services].map((value) =>
      value.toLowerCase()
    )
  );
  const interests = new Set(context.support_interests.map((value) => value.toLowerCase()));

  for (const tag of entry.tags.service_types) {
    if (requested.has(tag.toLowerCase())) score += 4;
    if (Array.from(requested).some((value) => value.includes(tag.toLowerCase()))) score += 2;
  }

  for (const goal of entry.tags.goals) {
    if (interests.has(goal.toLowerCase())) score += 2;
  }

  if (context.budget && entry.tags.budget_range === context.budget) score += 3;

  return score;
};

const readLibraryFromS3 = async (): Promise<ProposalLibraryEntry[]> => {
  const bucket = proposalsStorageConfig.libraryBucket;
  if (!bucket) return [];

  const prefixes = new Set<string>();
  let continuationToken: string | undefined;

  do {
    const response = await getS3Client().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: proposalsStorageConfig.libraryPrefix,
        ContinuationToken: continuationToken,
      })
    );
    for (const item of response.Contents ?? []) {
      const match = item.Key?.match(
        new RegExp(
          `^${proposalsStorageConfig.libraryPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^/]+)/`
        )
      );
      if (match?.[1]) prefixes.add(match[1]);
    }
    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  const entries: ProposalLibraryEntry[] = [];
  for (const serviceType of Array.from(prefixes)) {
    try {
      const response = await getS3Client().send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: buildProposalLibraryProposalKey(serviceType),
        })
      );
      const body = await response.Body?.transformToString();
      if (!body) continue;
      entries.push(JSON.parse(body) as ProposalLibraryEntry);
    } catch {
      /* skip missing entries */
    }
  }
  return entries;
};

export const retrieveProposalExamples = async (
  context: ProposalContextPackage,
  limit = 4
): Promise<ProposalLibraryEntry[]> => {
  const remote = await readLibraryFromS3();
  const pool = remote.length > 0 ? remote : BUILTIN_PROPOSAL_LIBRARY;
  return [...pool]
    .sort((left, right) => scoreLibraryEntry(right, context) - scoreLibraryEntry(left, context))
    .slice(0, limit);
};

export const listProposalLibraryPrefixes = (): string[] =>
  BUILTIN_PROPOSAL_LIBRARY.map((entry) => entry.service_type);
