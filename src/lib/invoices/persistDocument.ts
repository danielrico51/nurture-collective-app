import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { clientsCrmStorageConfig, getClientsStorageMode } from "@/lib/clients/config";
import { writeClientsText, readClientsText } from "@/lib/clients/platformS3";
import { buildServiceInvoiceDocumentKey } from "@/lib/client-services/paths";

const localPath = (key: string) =>
  path.join(clientsCrmStorageConfig.localDataRoot, key);

export const persistInvoiceHtmlDocument = async (input: {
  clientId: string;
  serviceId: string;
  invoiceId: string;
  html: string;
}): Promise<string> => {
  const key = buildServiceInvoiceDocumentKey(
    input.clientId,
    input.serviceId,
    input.invoiceId
  );

  if (getClientsStorageMode() === "local") {
    const full = localPath(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, input.html, "utf8");
  } else {
    await writeClientsText(key, input.html);
  }

  return key;
};

export const readInvoiceHtmlDocument = async (input: {
  clientId: string;
  serviceId: string;
  invoiceId: string;
}): Promise<string | null> => {
  const key = buildServiceInvoiceDocumentKey(
    input.clientId,
    input.serviceId,
    input.invoiceId
  );

  if (getClientsStorageMode() === "local") {
    try {
      return await readFile(localPath(key), "utf8");
    } catch {
      return null;
    }
  }

  return readClientsText(key);
};
