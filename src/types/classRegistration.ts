export type ClassRegistrationStatus =
  | "confirmed"
  | "waitlisted"
  | "cancelled";

export type ClassRegistrationPaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "refunded";

export type ClassRegistrationPaymentMethod = "stripe" | "venmo" | "free";

export type ClassRegistrationSource =
  | "website"
  | "google_business"
  | "admin_manual";

export interface ClassRegistration {
  id: string;
  eventSlug: string;
  eventTitle: string;
  registrantName: string;
  registrantEmail: string;
  registrantPhone?: string;
  notes?: string;
  status: ClassRegistrationStatus;
  paymentStatus: ClassRegistrationPaymentStatus;
  paymentMethod?: ClassRegistrationPaymentMethod;
  paymentProvider?: string;
  paymentReference?: string;
  paidAt?: string;
  amountCents: number;
  source: ClassRegistrationSource;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  emailDelivery?: {
    lastAttemptAt: string;
    registrant?: boolean;
    admin?: boolean;
    instructor?: boolean;
    errors?: string[];
  };
}

export interface CreateClassRegistrationInput {
  registrantName: string;
  registrantEmail: string;
  registrantPhone?: string;
  notes?: string;
  source?: ClassRegistrationSource;
  paymentMethod?: ClassRegistrationPaymentMethod;
}

export interface ClassRegistrationPaymentInfo {
  required: boolean;
  method?: ClassRegistrationPaymentMethod;
  checkoutUrl?: string;
  venmoUrl?: string;
  venmoHandle?: string;
  amountCents?: number;
  message?: string;
}

export interface RegisterForEventResponse {
  registration: ClassRegistration;
  payment?: ClassRegistrationPaymentInfo;
}

export interface UpdateClassRegistrationInput {
  status?: ClassRegistrationStatus;
  paymentStatus?: ClassRegistrationPaymentStatus;
  paymentMethod?: ClassRegistrationPaymentMethod;
}

export interface ClassAvailability {
  eventSlug: string;
  capacity: number | null;
  confirmedCount: number;
  waitlistCount: number;
  spotsRemaining: number | null;
  waitlistEnabled: boolean;
  registrationOpen: boolean;
}
