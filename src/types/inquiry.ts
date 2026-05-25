export type PreferredContactMethod = "email" | "whatsapp" | "call";

export interface InquiryPayload {
  source: "website" | "member-intake";
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredContact: PreferredContactMethod;
  serviceInterest?: string;
  submittedAt: string;
  userId?: string;
}

export const PREFERRED_CONTACT_OPTIONS: {
  value: PreferredContactMethod;
  label: string;
}[] = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "call", label: "Phone call" },
];

export const SERVICE_SLUGS: Record<string, string> = {
  prenatal: "Prenatal concierge",
  postpartum: "Postpartum recovery",
  feeding: "Lactation & feeding support",
  wellness: "Emotional wellness",
  practical: "Household & practical help",
  membership: "Custom care plans",
};
