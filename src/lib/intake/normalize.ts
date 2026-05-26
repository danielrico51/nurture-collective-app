import type { IntakeProfile } from "@/types/intake";

const emptySchedule = () => ({
  days: [] as string[],
  times: [] as string[],
  modality: "either" as const,
  timezone: "America/New_York",
});

export const createEmptyProfile = (
  userId: string,
  overrides: Partial<IntakeProfile> = {}
): IntakeProfile => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    userId,
    name: "",
    email: "",
    phone: "",
    smsConsent: false,
    maternalStage: null,
    dueDate: null,
    trimester: null,
    postpartumWeeks: null,
    postpartumMonths: null,
    supportInterests: [],
    challenges: [],
    challengesFreeText: "",
    preferredSchedule: emptySchedule(),
    locationZip: "",
    insuranceProvider: "",
    insuranceInterested: null,
    budgetPreference: null,
    intakeStatus: "draft",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

export const normalizeProfile = (raw: Partial<IntakeProfile>): IntakeProfile => {
  const base = createEmptyProfile(raw.userId ?? "unknown", {
    id: raw.id ?? crypto.randomUUID(),
    createdAt: raw.createdAt ?? new Date().toISOString(),
  });

  return {
    ...base,
    ...raw,
    supportInterests: Array.isArray(raw.supportInterests)
      ? raw.supportInterests
      : [],
    challenges: Array.isArray(raw.challenges) ? raw.challenges : [],
    challengesFreeText: raw.challengesFreeText ?? "",
    preferredSchedule: {
      ...emptySchedule(),
      ...(raw.preferredSchedule ?? {}),
      days: raw.preferredSchedule?.days ?? [],
      times: raw.preferredSchedule?.times ?? [],
    },
    intakeStatus: raw.intakeStatus ?? "draft",
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
};
