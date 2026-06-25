import type { ClientsCrmStorageScope } from "@/types/client";

export type ProviderRole =
  | "postpartum_doula"
  | "birth_doula"
  | "backup"
  | "educator"
  | "other";

export const PROVIDER_ROLES: ProviderRole[] = [
  "postpartum_doula",
  "birth_doula",
  "backup",
  "educator",
  "other",
];

export type ProviderStatus = "active" | "inactive" | "archived";

export const PROVIDER_STATUSES: ProviderStatus[] = [
  "active",
  "inactive",
  "archived",
];

/** First-class provider registry (doulas, educators, backup coverage). */
export interface ProviderRecord {
  providerId: string;
  displayName: string;
  /** Alternate spellings / spreadsheet labels for import matching. */
  aliases: string[];
  roles: ProviderRole[];
  email: string;
  phone: string;
  defaultHourlyRateCents: number | null;
  notes: string;
  status: ProviderStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  storageKey?: string;
}

export interface CreateProviderInput {
  displayName: string;
  aliases?: string[];
  roles?: ProviderRole[];
  email?: string;
  phone?: string;
  defaultHourlyRateCents?: number | null;
  notes?: string;
  status?: ProviderStatus;
}

export interface UpdateProviderInput {
  displayName?: string;
  aliases?: string[];
  roles?: ProviderRole[];
  email?: string;
  phone?: string;
  defaultHourlyRateCents?: number | null;
  notes?: string;
  status?: ProviderStatus;
  archive?: boolean;
  restore?: boolean;
}

export interface ProviderStats {
  providerId: string;
  engagementCount: number;
  primaryEngagementCount: number;
  lifetimeClientFeeCents: number;
  lifetimeDoulaPayoutCents: number;
  ytdEngagementCount: number;
  ytdClientFeeCents: number;
  ytdDoulaPayoutCents: number;
}

export interface AdminProvidersResponse {
  providers: ProviderRecord[];
  storage: ClientsCrmStorageScope;
}

export interface AdminProviderStatsResponse {
  stats: Record<string, ProviderStats>;
  year: number;
  storage: ClientsCrmStorageScope;
}
