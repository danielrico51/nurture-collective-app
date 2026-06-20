import "server-only";

import { matchProviderByLabel } from "@/lib/providers/matching";
import { listProviders, readProvider } from "@/lib/providers/storage";

export class ClientServiceProviderLinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientServiceProviderLinkError";
  }
}

export interface ClientServiceProviderFields {
  providerId: string | null;
  providerName: string;
}

/** Resolve provider registry link and keep display name in sync. */
export const applyClientServiceProviderFields = async (input: {
  providerId?: string | null;
  providerName?: string;
  /** When true, attempt to match free-text providerName to the registry. */
  matchByName?: boolean;
}): Promise<ClientServiceProviderFields> => {
  const providerId = input.providerId?.trim() || null;

  if (providerId) {
    const provider = await readProvider(providerId);
    if (!provider) {
      throw new ClientServiceProviderLinkError("Provider not found");
    }
    return {
      providerId,
      providerName: provider.displayName,
    };
  }

  const providerName = String(input.providerName ?? "").trim();
  if (!providerName) {
    return { providerId: null, providerName: "" };
  }

  if (input.matchByName !== false) {
    const providers = await listProviders();
    const matched = matchProviderByLabel(providerName, providers);
    if (matched) {
      return {
        providerId: matched.providerId,
        providerName: matched.displayName,
      };
    }
  }

  return { providerId: null, providerName };
};
