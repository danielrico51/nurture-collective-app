import { getClientsStorageMode } from "@/lib/clients/config";
import { writeLocalJson } from "@/lib/clients/localStorage";
import { writeClientsJson } from "@/lib/clients/platformS3";
import { buildExpectationKey } from "@/lib/schedule/paths";
import type { ClientPaymentExpectation } from "@/types/serviceEngagement";

export const savePaymentExpectation = async (
  clientId: string,
  expectation: ClientPaymentExpectation
): Promise<ClientPaymentExpectation> => {
  const key = buildExpectationKey(
    clientId,
    expectation.engagementId,
    expectation.expectationId
  );
  if (getClientsStorageMode() === "local") {
    await writeLocalJson(key, expectation);
  } else {
    await writeClientsJson(key, expectation);
  }
  return { ...expectation, storageKey: key };
};
