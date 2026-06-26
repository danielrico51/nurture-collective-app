import { readFile } from "fs/promises";
import path from "path";
import {
  clientsCrmStorageConfig,
  getClientsCrmBucket,
  resolveClientsCrmPrefix,
} from "@/lib/clients/config";
import {
  invalidateCrmStorageIndexCache,
  loadAllScheduleArtifacts,
  type LoadedScheduleArtifacts,
} from "@/lib/clients/crmIndexLoader";
import { rebuildDashboardSnapshot } from "@/lib/dashboard/snapshot";
import { resolveDeploymentEnvironment } from "@/lib/storage/deploymentEnvironment";
import {
  listProvidersFromScope,
  resolveProdProviderScope,
} from "@/lib/providers/crossEnvStorage";
import {
  auditProviderUnification,
  mergeProviderAliases,
  type ProviderMatchAudit,
  type ProviderMatchPair,
  type ProviderUnifyOverrides,
} from "@/lib/providers/prodDevMatching";
import {
  deleteProvider,
  listProviders,
  upsertProviderRecord,
} from "@/lib/providers/storage";
import { reallocateAllProviderReferences } from "@/lib/schedule/providerEngagements";
import type { ProviderRecord } from "@/types/provider";

export interface ProviderUnifyApplyResult {
  matched: number;
  prodCopied: number;
  devHistoricOnly: number;
  reallocatedEngagements: number;
  reallocatedServices: number;
  providersDeleted: number;
  idChanges: number;
}

export interface ProviderUnifyReport extends ProviderMatchAudit {
  apply?: ProviderUnifyApplyResult;
}

const DEFAULT_OVERRIDES_PATH = path.join(
  process.cwd(),
  "scripts/data/provider-unify-overrides.json"
);

export const assertDevWriteTarget = (): void => {
  const deployment = resolveDeploymentEnvironment();
  if (deployment === "prod") {
    throw new Error("Refusing to unify providers while APP_ENV=prod");
  }

  const bucket = getClientsCrmBucket().toLowerCase();
  if (bucket.includes("prod")) {
    throw new Error(
      "Refusing to unify providers when NURTURE_CLIENTS_BUCKET looks like production"
    );
  }

  const prodBucket = process.env.PROD_NURTURE_CLIENTS_BUCKET?.trim().toLowerCase();
  if (prodBucket && prodBucket === bucket) {
    throw new Error(
      "PROD_NURTURE_CLIENTS_BUCKET must differ from NURTURE_CLIENTS_BUCKET"
    );
  }
};

export const loadProviderUnifyOverrides = async (
  overridesPath = DEFAULT_OVERRIDES_PATH
): Promise<ProviderUnifyOverrides> => {
  try {
    const raw = await readFile(overridesPath, "utf8");
    return JSON.parse(raw) as ProviderUnifyOverrides;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return { matches: [] };
    throw error;
  }
};

export const loadProdAndDevProviders = async (): Promise<{
  prodProviders: ProviderRecord[];
  devProviders: ProviderRecord[];
  prodScope: ReturnType<typeof resolveProdProviderScope>;
}> => {
  const prodScope = resolveProdProviderScope();
  const [prodProviders, devProviders] = await Promise.all([
    listProvidersFromScope(prodScope, { includeArchived: true }),
    listProviders({ includeArchived: true }),
  ]);
  return { prodProviders, devProviders, prodScope };
};

export const auditDevProviderUnification = async (
  overrides: ProviderUnifyOverrides = {}
): Promise<ProviderUnifyReport> => {
  const { prodProviders, devProviders } = await loadProdAndDevProviders();
  return auditProviderUnification(prodProviders, devProviders, overrides);
};

const buildUnifiedProvider = (
  prod: ProviderRecord,
  dev: ProviderRecord
): ProviderRecord => {
  const aliases = mergeProviderAliases(prod, dev);
  return {
    ...prod,
    aliases,
    updatedAt: new Date().toISOString(),
  };
};

const applyMatchedPair = async (
  pair: ProviderMatchPair,
  dryRun: boolean,
  artifacts?: LoadedScheduleArtifacts
): Promise<{
  idChanged: boolean;
  engagementUpdates: number;
  serviceUpdates: number;
  deleted: boolean;
}> => {
  const { prod, dev } = pair;
  const idChanged = prod.providerId !== dev.providerId;

  if (dryRun) {
    return {
      idChanged,
      engagementUpdates: idChanged ? -1 : 0,
      serviceUpdates: idChanged ? -1 : 0,
      deleted: idChanged,
    };
  }

  const unified = buildUnifiedProvider(prod, dev);
  await upsertProviderRecord(unified);

  if (!idChanged) {
    return {
      idChanged: false,
      engagementUpdates: 0,
      serviceUpdates: 0,
      deleted: false,
    };
  }

  const reallocated = await reallocateAllProviderReferences(
    {
      fromProviderId: dev.providerId,
      toProviderId: prod.providerId,
      toProviderName: prod.displayName,
    },
    { artifacts }
  );

  await deleteProvider(dev.providerId);

  return {
    idChanged: true,
    engagementUpdates: reallocated.engagementUpdates,
    serviceUpdates: reallocated.serviceUpdates,
    deleted: true,
  };
};

const applyProdOnlyCopy = async (
  prod: ProviderRecord,
  dryRun: boolean
): Promise<boolean> => {
  if (dryRun) return true;
  await upsertProviderRecord({
    ...prod,
    updatedAt: new Date().toISOString(),
  });
  return true;
};

export const runDevProviderUnification = async (options?: {
  dryRun?: boolean;
  overrides?: ProviderUnifyOverrides;
  rebuildSnapshot?: boolean;
}): Promise<ProviderUnifyReport> => {
  const dryRun = options?.dryRun ?? false;
  const rebuildSnapshot = options?.rebuildSnapshot ?? !dryRun;
  const overrides = options?.overrides ?? (await loadProviderUnifyOverrides());

  if (!dryRun) {
    assertDevWriteTarget();
  }

  const audit = await auditDevProviderUnification(overrides);
  if (audit.blocked) {
    return audit;
  }

  invalidateCrmStorageIndexCache();
  let artifacts = dryRun ? undefined : await loadAllScheduleArtifacts();

  const apply: ProviderUnifyApplyResult = {
    matched: audit.matched.length,
    prodCopied: 0,
    devHistoricOnly: audit.devOnly.length,
    reallocatedEngagements: 0,
    reallocatedServices: 0,
    providersDeleted: 0,
    idChanges: 0,
  };

  for (const pair of audit.matched) {
    if (!dryRun) {
      console.log(
        `Unifying ${pair.dev.displayName} → ${pair.prod.displayName}${
          pair.prod.providerId !== pair.dev.providerId ? " (ID change)" : ""
        }…`
      );
    }
    const result = await applyMatchedPair(pair, dryRun, artifacts);
    if (result.idChanged) {
      apply.idChanges += 1;
      if (!dryRun) {
        apply.reallocatedEngagements += result.engagementUpdates;
        apply.reallocatedServices += result.serviceUpdates;
        invalidateCrmStorageIndexCache();
        artifacts = await loadAllScheduleArtifacts();
      }
    }
    if (result.deleted && !dryRun) {
      apply.providersDeleted += 1;
    }
  }

  for (const prod of audit.prodOnly) {
    if (!dryRun) {
      console.log(`Copying prod provider ${prod.displayName}…`);
    }
    const copied = await applyProdOnlyCopy(prod, dryRun);
    if (copied) apply.prodCopied += 1;
  }

  if (!dryRun && rebuildSnapshot) {
    await rebuildDashboardSnapshot({ force: true });
  }

  return { ...audit, apply };
};

export const formatProviderUnifyReport = (
  report: ProviderUnifyReport,
  dryRun: boolean
): string => {
  const lines: string[] = [
    dryRun ? "Provider unify audit (dry run)" : "Provider unify results",
    "",
    `Prod scope: s3://${resolveProdProviderScope().bucket}/${resolveProdProviderScope().crmPrefix}providers/`,
    `Dev scope: ${clientsCrmStorageConfig.useLocalStorage ? clientsCrmStorageConfig.localDataRoot : `s3://${getClientsCrmBucket()}/${resolveClientsCrmPrefix()}`}`,
    "",
    `Matched pairs: ${report.matched.length}`,
    `Prod-only (copy to dev): ${report.prodOnly.length}`,
    `Dev-only historic (unchanged): ${report.devOnly.length}`,
    `Ambiguous (blocked): ${report.ambiguous.length}`,
  ];

  if (report.matched.length > 0) {
    lines.push("", dryRun ? "Would unify:" : "Unified:");
    for (const pair of report.matched) {
      const idChange =
        pair.prod.providerId !== pair.dev.providerId ? " [ID change]" : "";
      lines.push(
        `  - ${pair.prod.displayName} ← ${pair.dev.displayName} (${pair.tier})${idChange}`
      );
    }
  }

  if (report.prodOnly.length > 0) {
    lines.push("", dryRun ? "Would copy from prod:" : "Copied from prod:");
    for (const prod of report.prodOnly) {
      lines.push(`  - ${prod.displayName}`);
    }
  }

  if (report.devOnly.length > 0) {
    lines.push("", "Dev-only historic (no changes):");
    for (const dev of report.devOnly) {
      lines.push(`  - ${dev.displayName}`);
    }
  }

  if (report.ambiguous.length > 0) {
    lines.push("", "Ambiguous matches (add overrides to resolve):");
    for (const item of report.ambiguous) {
      lines.push(`  - ${item.reason}`);
      if (item.prod) lines.push(`    prod: ${item.prod.displayName}`);
      for (const dev of item.devCandidates) {
        lines.push(`    dev candidate: ${dev.displayName} (${dev.providerId})`);
      }
    }
  }

  if (report.apply) {
    lines.push(
      "",
      `ID changes: ${report.apply.idChanges}`,
      `Providers deleted on dev: ${report.apply.providersDeleted}`,
      `Engagement reference updates: ${report.apply.reallocatedEngagements}`,
      `Client service reference updates: ${report.apply.reallocatedServices}`
    );
  }

  if (report.blocked) {
    lines.push(
      "",
      "Apply blocked until ambiguous matches are resolved via scripts/data/provider-unify-overrides.json"
    );
  }

  return lines.join("\n");
};

export const providerUnifyReportToJson = (
  report: ProviderUnifyReport
): string =>
  JSON.stringify(
    {
      matched: report.matched.map((pair) => ({
        tier: pair.tier,
        prodProviderId: pair.prod.providerId,
        prodDisplayName: pair.prod.displayName,
        devProviderId: pair.dev.providerId,
        devDisplayName: pair.dev.displayName,
        idChange: pair.prod.providerId !== pair.dev.providerId,
      })),
      prodOnly: report.prodOnly.map((provider) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
      })),
      devOnly: report.devOnly.map((provider) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
      })),
      ambiguous: report.ambiguous,
      blocked: report.blocked,
      apply: report.apply ?? null,
    },
    null,
    2
  );
