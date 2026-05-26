export type MaternalStage =
  | "trying-to-conceive"
  | "pregnant"
  | "newly-postpartum"
  | "infant-care"
  | "toddler"
  | "multiple-children";

export type Trimester = "first" | "second" | "third";

export type SupportInterest =
  | "birth-doula"
  | "postpartum-doula"
  | "lactation"
  | "sleep-consulting"
  | "pelvic-floor"
  | "mental-wellness"
  | "nutrition"
  | "childbirth-education"
  | "pediatric-guidance"
  | "general-support";

export type ChallengeOption =
  | "sleep-deprivation"
  | "breastfeeding-pain"
  | "anxiety"
  | "overwhelm"
  | "recovery"
  | "scheduling-help"
  | "lack-of-support"
  | "returning-to-work";

export type ScheduleModality = "virtual" | "in-person" | "either";

export type BudgetPreference =
  | "insurance-first"
  | "flexible"
  | "budget-conscious"
  | "premium";

export type IntakeStatus = "draft" | "submitted" | "in-review";

export const INTAKE_STATUSES: IntakeStatus[] = [
  "draft",
  "submitted",
  "in-review",
];

export const isIntakeComplete = (status?: IntakeStatus | null): boolean =>
  status === "submitted" || status === "in-review";

export interface PreferredSchedule {
  days: string[];
  times: string[];
  modality: ScheduleModality;
  timezone: string;
}

export interface IntakeProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  smsConsent: boolean;
  maternalStage: MaternalStage | null;
  dueDate: string | null;
  trimester: Trimester | null;
  postpartumWeeks: number | null;
  postpartumMonths: number | null;
  supportInterests: SupportInterest[];
  challenges: ChallengeOption[];
  challengesFreeText: string;
  preferredSchedule: PreferredSchedule;
  locationZip: string;
  insuranceProvider: string;
  insuranceInterested: boolean | null;
  budgetPreference: BudgetPreference | null;
  intakeStatus: IntakeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CareRecommendation {
  id: string;
  userId: string;
  intakeProfileId: string;
  recommendationType: SupportInterest | string;
  priorityLevel: 1 | 2 | 3;
  recommendationReason: string;
  createdAt: string;
}

export interface IntakeDocument {
  version: 1;
  profiles: IntakeProfile[];
  recommendations: CareRecommendation[];
  updatedAt: string;
}

/** Client-side draft — partial fields allowed during onboarding */
export type IntakeDraft = Partial<
  Omit<IntakeProfile, "id" | "userId" | "createdAt" | "updatedAt" | "intakeStatus">
> & {
  intakeStatus?: IntakeStatus;
};

export interface IntakeSubmitPayload {
  profile: IntakeDraft & {
    name: string;
    email: string;
    phone: string;
    maternalStage: MaternalStage;
    supportInterests: SupportInterest[];
  };
}

export interface IntakeApiResponse {
  profile: IntakeProfile | null;
  recommendations: CareRecommendation[];
}
