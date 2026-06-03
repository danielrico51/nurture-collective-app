import type { MaternalStage } from "@/types/intake";

/** How someone is on the path to parenthood (stored in community profile_metadata). */
export type JourneyPath = "ttc" | "ivf" | "other";

export const JOURNEY_PATH_OPTIONS: {
  value: JourneyPath;
  label: string;
}[] = [
  { value: "ttc", label: "Trying to conceive (natural)" },
  { value: "ivf", label: "IVF or fertility treatment" },
  { value: "other", label: "Another path (adoption, surrogate, etc.)" },
];

export const JOURNEY_STAGE_OPTIONS: {
  value: MaternalStage;
  label: string;
  shortHint: string;
}[] = [
  {
    value: "trying-to-conceive",
    label: "Trying to conceive / future mom",
    shortHint: "TTC, IVF, or planning — no due date required",
  },
  {
    value: "pregnant",
    label: "Pregnant",
    shortHint: "Use your due date or best estimate (IVF included)",
  },
  {
    value: "newly-postpartum",
    label: "Newly postpartum",
    shortHint: "Weeks since baby's birth",
  },
  {
    value: "infant-care",
    label: "Infant (under 1 year)",
    shortHint: "Baby's age in weeks",
  },
  {
    value: "toddler",
    label: "Toddler & beyond",
    shortHint: "Browse and join groups that fit",
  },
  {
    value: "multiple-children",
    label: "Multiple children",
    shortHint: "Browse and join groups that fit",
  },
];

export type JourneyProfileMetadata = {
  maternal_stage?: MaternalStage;
  journey_path?: JourneyPath;
  due_date?: string;
  estimated_due_date?: string;
  postpartum_weeks?: number;
  postpartum_months?: number;
  newborn_age_days?: number;
};

/** Build metadata payload for PATCH /users/me from the matcher form. */
export function buildJourneyMetadata(input: {
  stage: MaternalStage;
  journeyPath?: JourneyPath;
  dueDate?: string;
  postpartumWeeks?: string;
  babyAgeWeeks?: string;
}): JourneyProfileMetadata {
  const meta: JourneyProfileMetadata = { maternal_stage: input.stage };

  if (input.stage === "trying-to-conceive" && input.journeyPath) {
    meta.journey_path = input.journeyPath;
  }

  if (input.stage === "pregnant" && input.dueDate?.trim()) {
    const d = input.dueDate.trim().slice(0, 10);
    meta.due_date = d;
    meta.estimated_due_date = d;
  }

  if (input.stage === "newly-postpartum" && input.postpartumWeeks?.trim()) {
    const weeks = parseInt(input.postpartumWeeks, 10);
    if (!Number.isNaN(weeks) && weeks >= 0) {
      meta.postpartum_weeks = weeks;
    }
  }

  if (input.stage === "infant-care" && input.babyAgeWeeks?.trim()) {
    const weeks = parseInt(input.babyAgeWeeks, 10);
    if (!Number.isNaN(weeks) && weeks >= 0) {
      meta.postpartum_weeks = weeks;
      meta.newborn_age_days = Math.min(weeks * 7, 364);
    }
  }

  return meta;
}

export function journeyFieldsFromMetadata(
  meta: Record<string, unknown> | undefined
): {
  stage: MaternalStage | "";
  journeyPath: JourneyPath | "";
  dueDate: string;
  postpartumWeeks: string;
  babyAgeWeeks: string;
} {
  const m = meta ?? {};
  const stage = (m.maternal_stage as MaternalStage) || "";
  const due =
    (typeof m.due_date === "string" && m.due_date) ||
    (typeof m.estimated_due_date === "string" && m.estimated_due_date) ||
    "";
  const weeks =
    typeof m.postpartum_weeks === "number"
      ? String(m.postpartum_weeks)
      : typeof m.postpartum_weeks === "string"
        ? m.postpartum_weeks
        : "";
  const babyWeeks =
    typeof m.newborn_age_days === "number"
      ? String(Math.max(0, Math.floor(m.newborn_age_days / 7)))
      : weeks;

  return {
    stage,
    journeyPath: (m.journey_path as JourneyPath) || "",
    dueDate: due.slice(0, 10),
    postpartumWeeks: weeks,
    babyAgeWeeks: babyWeeks,
  };
}
