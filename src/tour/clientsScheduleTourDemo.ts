import type { EngagementServiceType } from "@/types/serviceEngagement";
import type { PaymentMethodId } from "@/types/clientService";

/** Demo booking data pre-filled when the tour opens the engagement form. */
export type ScheduleTourBookDraft = {
  serviceType: EngagementServiceType;
  bookDate: string;
  estimatedDate: string;
  estimatedNotes: string;
  scheduleYear: string;
  primaryProviderId: string;
  clientFee: string;
  hoursTotal: string;
  schedulePattern: string;
  doulaFee: string;
  depositAmount: string;
  depositPaidAt: string;
  balanceAmount: string;
  balanceDueDate: string;
  balanceDueLabel: string;
  preferredPaymentMethod: PaymentMethodId | "";
};

export const buildScheduleTourDemoDraft = (): ScheduleTourBookDraft => {
  const today = new Date();
  const bookDate = today.toISOString().slice(0, 10);
  const estimated = new Date(today);
  estimated.setMonth(estimated.getMonth() + 3);
  const balanceDue = new Date(today);
  balanceDue.setMonth(balanceDue.getMonth() + 4);

  return {
    serviceType: "postpartum",
    bookDate,
    estimatedDate: estimated.toISOString().slice(0, 10),
    estimatedNotes: "Tour demo — replace before saving a real engagement.",
    scheduleYear: bookDate.slice(0, 4),
    primaryProviderId: "",
    clientFee: "5400",
    hoursTotal: "40",
    schedulePattern: "9 (8) hr days",
    doulaFee: "3200",
    depositAmount: "500",
    depositPaidAt: "",
    balanceAmount: "4900",
    balanceDueDate: balanceDue.toISOString().slice(0, 10),
    balanceDueLabel: "after 1st wk",
    preferredPaymentMethod: "zelle",
  };
};
