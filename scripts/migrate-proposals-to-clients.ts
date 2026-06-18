/**
 * One-time migration: move proposals (and billing links) from the legacy
 * `client_id == lead_id` model to first-class Client records with their own UUID.
 *
 * For every existing proposal partition `clients/client_id=<leadId>/...` this
 * script creates (or reuses) a Client linked to that lead, copies the proposal
 * objects to `clients/client_id=<newClientId>/...`, rewrites metadata, and
 * repoints matching billing orders to the new client id.
 *
 * Usage:
 *   npm run migrate:clients -- --dry-run   # preview only (no writes)
 *   npm run migrate:clients                # perform migration (keeps old copies)
 *   npm run migrate:clients -- --delete-old # also remove the old proposal copies
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const loadEnvFile = (filename: string) => {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
};

loadEnvFile(".env.local");
loadEnvFile(".env");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run") || process.env.DRY_RUN === "true";
const deleteOld = args.includes("--delete-old");

const log = (...parts: unknown[]) => console.log("[migrate:clients]", ...parts);

const main = async () => {
  const {
    GetObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    DeleteObjectCommand,
    S3Client,
  } = await import("@aws-sdk/client-s3");
  const { promises: fs } = await import("fs");
  const path = await import("path");

  const { getProposalsBucket, getProposalsStorageMode } = await import(
    "../src/lib/proposals/config"
  );
  const { localProposalDataRoot } = await import("../src/lib/proposals/paths");
  const {
    parseProposalClientId,
    rewriteProposalKeyForClient,
    rewriteProposalMetadataForClient,
  } = await import("../src/lib/clients/migration");
  const { sanitizeClientSegment } = await import("../src/lib/clients/paths");
  const { ensureMigratedClientForLead, findClientByLeadId } = await import(
    "../src/lib/clients/storage"
  );
  const { readPurchaseOrder, updatePurchaseOrder } = await import(
    "../src/lib/billing/storage"
  );
  const { serverBillingConfig } = await import("../src/config/billing");

  type ProposalMetadata = import("../src/types/proposal").ProposalMetadata;

  const mode = getProposalsStorageMode();
  log(`storage mode: ${mode}, dry-run: ${dryRun}, delete-old: ${deleteOld}`);

  // Map of legacy leadId -> new clientId (used for billing repointing).
  const leadToClient = new Map<string, string>();

  const getServerCreds = async () => {
    const { getServerCredentials } = await import(
      "../src/lib/aws/amplifyCredentials"
    );
    return getServerCredentials();
  };

  const resolveClientId = async (
    leadId: string,
    fallback: { name?: string; email?: string }
  ): Promise<string> => {
    if (leadToClient.has(leadId)) return leadToClient.get(leadId)!;
    if (dryRun) {
      const existing = await findClientByLeadId(leadId);
      const id = existing?.clientId ?? "<new-client-id>";
      leadToClient.set(leadId, id);
      return id;
    }
    const client = await ensureMigratedClientForLead(leadId, fallback);
    leadToClient.set(leadId, client.clientId);
    return client.clientId;
  };

  if (mode === "s3") {
    const bucket = getProposalsBucket();
    if (!bucket) throw new Error("Proposals bucket is not configured");
    const s3 = new S3Client({
      region:
        process.env.AWS_REGION ??
        process.env.NEXT_PUBLIC_AWS_REGION ??
        "us-east-1",
      credentials: await getServerCreds(),
    });

    const listKeys = async (prefix: string): Promise<string[]> => {
      const keys: string[] = [];
      let token: string | undefined;
      do {
        const response = await s3.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: token,
          })
        );
        for (const item of response.Contents ?? []) {
          if (item.Key) keys.push(item.Key);
        }
        token = response.IsTruncated ? response.NextContinuationToken : undefined;
      } while (token);
      return keys;
    };

    const readKey = async (key: string): Promise<string | null> => {
      try {
        const response = await s3.send(
          new GetObjectCommand({ Bucket: bucket, Key: key })
        );
        return (await response.Body?.transformToString()) ?? null;
      } catch {
        return null;
      }
    };

    const allKeys = await listKeys("clients/");
    // Group keys by their (sanitized) client id segment.
    const groups = new Map<string, string[]>();
    for (const key of allKeys) {
      const seg = parseProposalClientId(key);
      if (!seg) continue;
      const list = groups.get(seg) ?? [];
      list.push(key);
      groups.set(seg, list);
    }

    log(`found ${groups.size} legacy client partition(s)`);

    for (const [oldSeg, keys] of Array.from(groups.entries())) {
      const metaKey = keys.find((key) => key.endsWith("/metadata.json"));
      if (!metaKey) {
        log(`skip ${oldSeg}: no metadata.json found`);
        continue;
      }
      const metaRaw = await readKey(metaKey);
      if (!metaRaw) {
        log(`skip ${oldSeg}: metadata unreadable`);
        continue;
      }
      const sampleMeta = JSON.parse(metaRaw) as ProposalMetadata;
      const leadId = sampleMeta.client_id;
      const newClientId = await resolveClientId(leadId, {});

      if (sanitizeClientSegment(newClientId) === oldSeg) {
        log(`skip ${oldSeg}: already migrated`);
        continue;
      }

      log(
        `migrate lead ${leadId} (${oldSeg}) -> client ${newClientId}: ${keys.length} object(s)`
      );

      if (dryRun) continue;

      for (const key of keys) {
        const newKey = rewriteProposalKeyForClient(key, oldSeg, newClientId);
        const raw = await readKey(key);
        if (raw === null) continue;
        let body = raw;
        if (key.endsWith("/metadata.json")) {
          const meta = JSON.parse(raw) as ProposalMetadata;
          body = JSON.stringify(
            rewriteProposalMetadataForClient(meta, newClientId),
            null,
            2
          );
        }
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: newKey,
            Body: body,
            ContentType: "application/json",
          })
        );
      }

      if (deleteOld) {
        for (const key of keys) {
          await s3.send(
            new DeleteObjectCommand({ Bucket: bucket, Key: key })
          );
        }
      }
    }
  } else {
    // Local filesystem migration.
    const root = path.join(localProposalDataRoot(), "clients");
    let clientDirs: string[] = [];
    try {
      const entries = await fs.readdir(root, { withFileTypes: true });
      clientDirs = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch {
      clientDirs = [];
    }

    log(`found ${clientDirs.length} local client partition(s) in ${root}`);

    for (const oldSeg of clientDirs) {
      const clientDir = path.join(root, oldSeg);
      const proposalDirs = (
        await fs.readdir(clientDir, { withFileTypes: true })
      )
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      let leadId: string | null = null;
      for (const pid of proposalDirs) {
        const metaPath = path.join(clientDir, pid, "metadata.json");
        try {
          const meta = JSON.parse(
            await fs.readFile(metaPath, "utf8")
          ) as ProposalMetadata;
          leadId = meta.client_id;
          break;
        } catch {
          // keep looking
        }
      }
      if (!leadId) {
        log(`skip ${oldSeg}: no readable metadata`);
        continue;
      }

      const newClientId = await resolveClientId(leadId, {});
      const newSeg = sanitizeClientSegment(newClientId);
      if (newSeg === oldSeg) {
        log(`skip ${oldSeg}: already migrated`);
        continue;
      }

      log(`migrate lead ${leadId} (${oldSeg}) -> client ${newClientId}`);
      if (dryRun) continue;

      const targetDir = path.join(root, newSeg);
      await fs.cp(clientDir, targetDir, { recursive: true });

      // Rewrite metadata.json files in the copied tree.
      for (const pid of proposalDirs) {
        const metaPath = path.join(targetDir, pid, "metadata.json");
        try {
          const meta = JSON.parse(
            await fs.readFile(metaPath, "utf8")
          ) as ProposalMetadata;
          await fs.writeFile(
            metaPath,
            JSON.stringify(
              rewriteProposalMetadataForClient(meta, newClientId),
              null,
              2
            ),
            "utf8"
          );
        } catch {
          // ignore
        }
      }

      if (deleteOld) {
        await fs.rm(clientDir, { recursive: true, force: true });
      }
    }
  }

  // Repoint billing orders that referenced the legacy lead id.
  log("checking billing orders…");
  const billingIds = await (async (): Promise<string[]> => {
    if (serverBillingConfig.useLocalStorage) {
      try {
        const entries = await fs.readdir(
          path.join(process.cwd(), ".data", "billing", "orders"),
          { withFileTypes: true }
        );
        return entries
          .filter(
            (entry) => entry.isDirectory() && entry.name.startsWith("order_id=")
          )
          .map((entry) => entry.name.replace(/^order_id=/, ""));
      } catch {
        return [];
      }
    }
    const s3 = new S3Client({
      region:
        process.env.AWS_REGION ??
        process.env.NEXT_PUBLIC_AWS_REGION ??
        "us-east-1",
      credentials: await getServerCreds(),
    });
    const ids: string[] = [];
    let token: string | undefined;
    do {
      const response = await s3.send(
        new ListObjectsV2Command({
          Bucket: serverBillingConfig.s3Bucket,
          Prefix: "billing/orders/",
          ContinuationToken: token,
        })
      );
      for (const item of response.Contents ?? []) {
        const match = item.Key?.match(/order_id=([^/]+)\/order\.json$/);
        if (match?.[1]) ids.push(match[1]);
      }
      token = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (token);
    return ids;
  })();

  let billingUpdates = 0;
  for (const orderId of billingIds) {
    const order = await readPurchaseOrder(orderId);
    if (!order) continue;
    const legacyId = order.leadId || order.clientId;
    if (!legacyId) continue;
    const newClientId = leadToClient.get(legacyId);
    if (!newClientId || newClientId === "<new-client-id>") continue;
    if (order.clientId === newClientId) continue;
    log(`order ${orderId}: clientId ${order.clientId ?? "—"} -> ${newClientId}`);
    billingUpdates += 1;
    if (!dryRun) {
      await updatePurchaseOrder(orderId, {
        clientId: newClientId,
        leadId: order.leadId ?? legacyId,
      });
    }
  }

  log(
    dryRun
      ? `dry-run complete. ${leadToClient.size} client mapping(s), ${billingUpdates} billing order(s) would change.`
      : `migration complete. ${leadToClient.size} client(s), ${billingUpdates} billing order(s) updated.`
  );
};

main().catch((error) => {
  console.error("[migrate:clients] failed:", error);
  process.exit(1);
});
