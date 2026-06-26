import { randomUUID } from "crypto";
import { getClientsStorageMode } from "@/lib/clients/config";
import {
  deleteLocalJson,
  listLocalKeys,
  readLocalJson,
  writeLocalJson,
} from "@/lib/clients/localStorage";
import {
  deleteClientsJson,
  listClientsKeys,
  readClientsJson,
  writeClientsJson,
} from "@/lib/clients/platformS3";
import { matchProviderByLabel } from "@/lib/providers/matching";
import {
  buildProviderByNameIndexKey,
  buildProviderKey,
  buildProviderListPrefix,
  type ProviderIndexEntry,
} from "@/lib/providers/paths";
import {
  ProviderValidationError,
  validateCreateProviderInput,
  validateUpdateProviderInput,
} from "@/lib/providers/validation";
import type { ProviderRecord } from "@/types/provider";

export { ProviderValidationError } from "@/lib/providers/validation";
export {
  collectUniqueProviderLabels,
  matchProviderByLabel,
} from "@/lib/providers/matching";

const listKeys = async (prefix: string): Promise<string[]> =>
  getClientsStorageMode() === "local"
    ? listLocalKeys(prefix)
    : listClientsKeys(prefix);

const readJson = async <T>(key: string): Promise<T | null> =>
  getClientsStorageMode() === "local"
    ? readLocalJson<T>(key)
    : readClientsJson<T>(key);

const writeJson = async (key: string, payload: unknown): Promise<void> => {
  if (getClientsStorageMode() === "local") {
    await writeLocalJson(key, payload);
  } else {
    await writeClientsJson(key, payload);
  }
};

const deleteJson = async (key: string): Promise<void> => {
  if (getClientsStorageMode() === "local") {
    await deleteLocalJson(key);
  } else {
    await deleteClientsJson(key);
  }
};

const readProviderIdByNameIndex = async (
  displayName: string
): Promise<string | null> => {
  const entry = await readJson<ProviderIndexEntry>(
    buildProviderByNameIndexKey(displayName)
  );
  return entry?.providerId ?? null;
};

const writeProviderNameIndexes = async (
  provider: ProviderRecord,
  previousNames: string[] = []
): Promise<void> => {
  for (const previous of previousNames) {
    await deleteJson(buildProviderByNameIndexKey(previous));
  }

  const names = new Set<string>();
  for (const name of [provider.displayName, ...provider.aliases]) {
    const trimmed = name.trim();
    if (trimmed) names.add(trimmed);
  }

  for (const name of Array.from(names)) {
    const payload: ProviderIndexEntry = { providerId: provider.providerId };
    await writeJson(buildProviderByNameIndexKey(name), payload);
  }
};

const saveProvider = async (
  provider: ProviderRecord
): Promise<ProviderRecord> => {
  const key = buildProviderKey(provider.providerId);
  await writeJson(key, provider);
  await writeProviderNameIndexes(provider);
  return { ...provider, storageKey: key };
};

export const readProvider = async (
  providerId: string
): Promise<ProviderRecord | null> =>
  readJson<ProviderRecord>(buildProviderKey(providerId));

export const getProviderByName = async (
  displayName: string
): Promise<ProviderRecord | null> => {
  const providerId = await readProviderIdByNameIndex(displayName);
  if (!providerId) return null;
  return readProvider(providerId);
};

export const listProviders = async (options?: {
  includeArchived?: boolean;
}): Promise<ProviderRecord[]> => {
  const includeArchived = options?.includeArchived ?? false;
  const prefix = buildProviderListPrefix();
  const keys = (await listKeys(prefix)).filter((key) =>
    key.endsWith("/provider.json")
  );

  const providers: ProviderRecord[] = [];
  for (const key of keys) {
    const record = await readJson<ProviderRecord>(key);
    if (!record) continue;
    if (!includeArchived && record.archivedAt) continue;
    providers.push({ ...record, storageKey: key });
  }

  providers.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, {
      sensitivity: "base",
    })
  );
  return providers;
};

export const createProvider = async (
  raw: unknown
): Promise<ProviderRecord> => {
  const input = validateCreateProviderInput(raw);
  const existing = await getProviderByName(input.displayName);
  if (existing && !existing.archivedAt) {
    throw new ProviderValidationError(
      `A provider named "${input.displayName}" already exists`
    );
  }

  const now = new Date().toISOString();
  const provider: ProviderRecord = {
    providerId: randomUUID(),
    displayName: input.displayName,
    aliases: input.aliases ?? [input.displayName],
    roles: input.roles ?? ["postpartum_doula"],
    email: input.email ?? "",
    phone: input.phone ?? "",
    defaultHourlyRateCents: input.defaultHourlyRateCents ?? null,
    notes: input.notes ?? "",
    status: input.status ?? "active",
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  return saveProvider(provider);
};

export const updateProvider = async (
  providerId: string,
  raw: unknown
): Promise<ProviderRecord> => {
  const updates = validateUpdateProviderInput(raw);
  const existing = await readProvider(providerId);
  if (!existing) {
    throw new ProviderValidationError("Provider not found");
  }

  if (updates.archive) {
    const now = new Date().toISOString();
    return saveProvider({
      ...existing,
      status: "archived",
      archivedAt: now,
      updatedAt: now,
    });
  }

  if (updates.restore) {
    const now = new Date().toISOString();
    return saveProvider({
      ...existing,
      status: "active",
      archivedAt: null,
      updatedAt: now,
    });
  }

  const previousNames = [existing.displayName, ...existing.aliases];
  const displayName = updates.displayName ?? existing.displayName;
  const next: ProviderRecord = {
    ...existing,
    displayName,
    aliases: updates.aliases
      ? Array.from(new Set([displayName, ...updates.aliases]))
      : existing.aliases,
    roles: updates.roles ?? existing.roles,
    email: updates.email ?? existing.email,
    phone: updates.phone ?? existing.phone,
    defaultHourlyRateCents:
      updates.defaultHourlyRateCents !== undefined
        ? updates.defaultHourlyRateCents
        : existing.defaultHourlyRateCents,
    notes: updates.notes ?? existing.notes,
    status: updates.status ?? existing.status,
    updatedAt: new Date().toISOString(),
  };

  if (updates.displayName && updates.displayName !== existing.displayName) {
    const conflict = await getProviderByName(updates.displayName);
    if (conflict && conflict.providerId !== providerId && !conflict.archivedAt) {
      throw new ProviderValidationError(
        `A provider named "${updates.displayName}" already exists`
      );
    }
  }

  const saved = await saveProvider(next);
  if (updates.displayName || updates.aliases) {
    await writeProviderNameIndexes(saved, previousNames);
  }
  return saved;
};

/** Write or replace a provider record and refresh name indexes. */
export const upsertProviderRecord = async (
  provider: ProviderRecord
): Promise<ProviderRecord> => {
  const existing = await readProvider(provider.providerId);
  const previousNames = existing
    ? [existing.displayName, ...existing.aliases]
    : [];
  const key = buildProviderKey(provider.providerId);
  const payload = { ...provider, storageKey: key, updatedAt: new Date().toISOString() };
  await writeJson(key, payload);
  await writeProviderNameIndexes(payload, previousNames);
  return payload;
};

/** Permanently remove a provider record and its name indexes. */
export const deleteProvider = async (providerId: string): Promise<void> => {
  const existing = await readProvider(providerId);
  if (!existing) {
    throw new ProviderValidationError("Provider not found");
  }

  const names = new Set<string>();
  for (const name of [existing.displayName, ...existing.aliases]) {
    const trimmed = name.trim();
    if (trimmed) names.add(trimmed);
  }

  for (const name of Array.from(names)) {
    const indexedId = await readProviderIdByNameIndex(name);
    if (indexedId === providerId) {
      await deleteJson(buildProviderByNameIndexKey(name));
    }
  }

  const key = buildProviderKey(providerId);
  await deleteJson(key);
};

export const findOrCreateProviderByLabel = async (
  label: string,
  options?: { roles?: ProviderRecord["roles"] }
): Promise<ProviderRecord> => {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new ProviderValidationError("Provider label is required");
  }

  const byIndex = await getProviderByName(trimmed);
  if (byIndex) return byIndex;

  const all = await listProviders({ includeArchived: true });
  const matched = matchProviderByLabel(trimmed, all);
  if (matched) return matched;

  return createProvider({
    displayName: trimmed,
    aliases: [trimmed],
    roles: options?.roles ?? ["postpartum_doula"],
    status: "active",
  });
};
