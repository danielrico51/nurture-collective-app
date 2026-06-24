import { quickBooksGet } from "@/lib/integrations/quickbooks/client";

export interface QuickBooksSalesFormsPrefs {
  ETransactionPaymentEnabled?: boolean;
  AllowOnlineCreditCardPayment?: boolean;
  AllowOnlineACHPayment?: boolean;
  [key: string]: unknown;
}

export type QuickBooksSurchargingHint = "enabled" | "disabled" | "unknown";

export interface QuickBooksPaymentsSetupStatus {
  onlinePaymentsEnabled: boolean;
  creditCardPaymentsEnabled: boolean;
  achPaymentsEnabled: boolean;
  surchargingHint: QuickBooksSurchargingHint;
  surchargingDetail: string;
  rawSurchargePreferenceKeys: string[];
}

const SURCHARGE_SETUP_URL =
  "https://quickbooks.intuit.com/learn-support/en-us/help-article/process-credit-card-payments/add-surcharge-customer-invoice-payments-quickbooks/L6Sg9UWf9_US_en_US";

export const QUICKBOOKS_SURCHARGE_SETUP_PATH =
  "Settings → Account and settings → Sales → Invoice payments → Percentage based surcharging";

export const parseQuickBooksPaymentsSetup = (
  salesFormsPrefs: QuickBooksSalesFormsPrefs | undefined
): QuickBooksPaymentsSetupStatus => {
  const sales = salesFormsPrefs ?? {};
  const surchargeKeys = Object.keys(sales).filter((key) =>
    /surcharge/i.test(key)
  );

  let surchargingHint: QuickBooksSurchargingHint = "unknown";
  let surchargingDetail =
    "QuickBooks does not reliably expose surcharge settings via API. " +
    `Enable and verify in QBO: ${QUICKBOOKS_SURCHARGE_SETUP_PATH}.`;

  for (const key of surchargeKeys) {
    const value = sales[key];
    if (value === true || value === "true" || value === "True") {
      surchargingHint = "enabled";
      surchargingDetail = `Preference ${key} is enabled. Confirm on a test invoice pay link that the surcharge line appears at checkout.`;
      break;
    }
    if (value === false || value === "false" || value === "False") {
      surchargingHint = "disabled";
      surchargingDetail = `Preference ${key} is disabled. Turn on surcharging in QBO (${QUICKBOOKS_SURCHARGE_SETUP_PATH}).`;
    }
  }

  const onlinePaymentsEnabled = Boolean(sales.ETransactionPaymentEnabled);

  return {
    onlinePaymentsEnabled,
    creditCardPaymentsEnabled:
      onlinePaymentsEnabled && sales.AllowOnlineCreditCardPayment !== false,
    achPaymentsEnabled:
      onlinePaymentsEnabled && sales.AllowOnlineACHPayment !== false,
    surchargingHint,
    surchargingDetail,
    rawSurchargePreferenceKeys: surchargeKeys,
  };
};

export const fetchQuickBooksPaymentsSetup =
  async (): Promise<QuickBooksPaymentsSetupStatus> => {
    const response = await quickBooksGet<{
      Preferences: { SalesFormsPrefs?: QuickBooksSalesFormsPrefs };
    }>("/preferences");

    return parseQuickBooksPaymentsSetup(response.Preferences?.SalesFormsPrefs);
  };

export const quickBooksSurchargeHelpUrl = (): string => SURCHARGE_SETUP_URL;
