import { clientsCrmStorageConfig, getClientsStorageMode } from "@/lib/clients/config";
import { readLocalJson, writeLocalJson } from "@/lib/clients/localStorage";
import {
  readClientsJson,
  writeClientsJson,
} from "@/lib/clients/platformS3";
import { buildInvoiceSequenceKey } from "@/lib/client-services/paths";

const INVOICE_PREFIX = "TNP";

interface InvoiceSequenceState {
  prefix: string;
  year: number;
  next: number;
}

const defaultSequence = (year: number): InvoiceSequenceState => ({
  prefix: INVOICE_PREFIX,
  year,
  next: 1,
});

const formatInvoiceNumber = (state: InvoiceSequenceState): string =>
  `${state.prefix}-${state.year}-${String(state.next).padStart(4, "0")}`;

const readSequence = async (): Promise<InvoiceSequenceState> => {
  const key = buildInvoiceSequenceKey();
  const mode = getClientsStorageMode();
  const currentYear = new Date().getFullYear();

  const stored =
    mode === "local"
      ? await readLocalJson<InvoiceSequenceState>(key)
      : await readClientsJson<InvoiceSequenceState>(key);

  if (!stored || stored.year !== currentYear) {
    return defaultSequence(currentYear);
  }

  return {
    prefix: stored.prefix || INVOICE_PREFIX,
    year: stored.year,
    next: Math.max(1, Number(stored.next) || 1),
  };
};

const writeSequence = async (state: InvoiceSequenceState): Promise<void> => {
  const key = buildInvoiceSequenceKey();
  if (getClientsStorageMode() === "local") {
    await writeLocalJson(key, state);
  } else {
    await writeClientsJson(key, state);
  }
};

/** Allocate the next formal invoice number (TNP-YYYY-####). */
export const allocateInvoiceNumber = async (): Promise<string> => {
  if (!clientsCrmStorageConfig.useLocalStorage && !clientsCrmStorageConfig.bucket) {
    throw new Error("Client CRM storage is not configured");
  }

  const state = await readSequence();
  const invoiceNumber = formatInvoiceNumber(state);

  await writeSequence({
    ...state,
    next: state.next + 1,
  });

  return invoiceNumber;
};

export { formatInvoiceNumber as formatInvoiceNumberForTest };
