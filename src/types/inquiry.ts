import type { Audience } from "@/content/site";

export type PreferredContactMethod = "email" | "whatsapp" | "call";

export type InquirySource = "website" | "member-intake";

export interface InquiryPayload {
  source: InquirySource;
  audience: Audience;
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredContact: PreferredContactMethod;
  serviceInterest?: string;
  providerSpecialty?: string;
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

export {
  SERVICE_SLUGS,
  PROVIDER_SPECIALTY_SLUGS,
  audienceLabels,
  isAudience,
} from "@/content/site";
