"use client";

import IntakeShell, { inputClassName } from "@/components/Intake/IntakeShell";
import OptionCard from "@/components/Intake/OptionCard";
import {
  BUDGET_OPTIONS,
  CHALLENGE_OPTIONS,
  DEFAULT_TIMEZONE,
  INTAKE_DRAFT_STORAGE_KEY,
  MATERNAL_STAGES,
  SCHEDULE_DAYS,
  SCHEDULE_TIMES,
  SUPPORT_INTERESTS,
} from "@/content/intake";
import { saveIntakeDraft, submitIntake } from "@/lib/api/intakeClient";
import type {
  BudgetPreference,
  ChallengeOption,
  IntakeDraft,
  MaternalStage,
  ScheduleModality,
  SupportInterest,
  Trimester,
} from "@/types/intake";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

type StepId =
  | "welcome"
  | "maternal-stage"
  | "pregnant-details"
  | "postpartum-details"
  | "care-interests"
  | "challenges"
  | "scheduling"
  | "insurance"
  | "contact";

const STEP_LABELS: Record<StepId, string> = {
  welcome: "Welcome",
  "maternal-stage": "Your journey",
  "pregnant-details": "Pregnancy details",
  "postpartum-details": "Postpartum details",
  "care-interests": "Support interests",
  challenges: "Current challenges",
  scheduling: "Scheduling",
  insurance: "Insurance & budget",
  contact: "Contact info",
};

const buildSteps = (stage: MaternalStage | null | undefined): StepId[] => {
  const steps: StepId[] = [
    "welcome",
    "maternal-stage",
  ];
  if (stage === "pregnant") steps.push("pregnant-details");
  if (stage === "newly-postpartum") steps.push("postpartum-details");
  steps.push(
    "care-interests",
    "challenges",
    "scheduling",
    "insurance",
    "contact"
  );
  return steps;
};

const toggleItem = <T extends string>(list: T[], value: T): T[] =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

interface IntakeFlowProps {
  userId: string;
  initialDraft?: IntakeDraft;
  alreadySubmitted?: boolean;
}

const IntakeFlow = ({
  userId,
  initialDraft,
  alreadySubmitted = false,
}: IntakeFlowProps) => {
  const router = useRouter();
  const [draft, setDraft] = useState<IntakeDraft>(() => ({
    preferredSchedule: {
      days: [],
      times: [],
      modality: "either",
      timezone: DEFAULT_TIMEZONE,
    },
    supportInterests: [],
    challenges: [],
    ...initialDraft,
  }));
  const [stepIndex, setStepIndex] = useState(alreadySubmitted ? 0 : 0);
  const [submitting, setSubmitting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = useMemo(
    () => buildSteps(draft.maternalStage),
    [draft.maternalStage]
  );
  const currentStepId = steps[stepIndex] ?? "welcome";
  const totalSteps = steps.length;

  const persistDraft = useCallback(
    (next: IntakeDraft) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `${INTAKE_DRAFT_STORAGE_KEY}-${userId}`,
          JSON.stringify(next)
        );
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveIntakeDraft(next).catch(() => {
          /* silent — local draft still available */
        });
      }, 600);
    },
    [userId]
  );

  const updateDraft = useCallback(
    (patch: Partial<IntakeDraft>) => {
      setDraft((prev) => {
        const next = { ...prev, ...patch };
        persistDraft(next);
        return next;
      });
    },
    [persistDraft]
  );

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );

  const goNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((index) => index + 1);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((index) => index - 1);
  };

  const handleSubmit = async () => {
    if (!draft.name?.trim() || !draft.phone?.trim() || !draft.maternalStage) {
      toast.error("Please complete all required fields.");
      return;
    }
    if (!draft.supportInterests?.length) {
      toast.error("Please select at least one type of support.");
      return;
    }

    setSubmitting(true);
    try {
      await submitIntake(draft);
      if (typeof window !== "undefined") {
        localStorage.removeItem(`${INTAKE_DRAFT_STORAGE_KEY}-${userId}`);
      }
      toast.success("Your support journey has started — welcome!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit intake"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const primaryButtonClass =
    "w-full rounded-full bg-nurture-sage py-3.5 text-sm font-semibold text-white transition hover:bg-nurture-sage-dark disabled:opacity-60";

  if (alreadySubmitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-3xl border border-nurture-sage/20 bg-gradient-to-b from-white to-nurture-cream/80 p-10 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            You&apos;ve already completed intake
          </h2>
          <p className="mt-3 text-nurture-charcoal/70">
            Your personalized recommendations are waiting on your dashboard.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-block rounded-full bg-nurture-sage px-8 py-3 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
          >
            View dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <IntakeShell
      currentStep={stepIndex + 1}
      totalSteps={totalSteps}
      stepLabel={STEP_LABELS[currentStepId]}
      onBack={goBack}
      showBack={currentStepId !== "welcome"}
    >
      {currentStepId === "welcome" ? (
        <div className="text-center">
          <div className="mx-auto mb-8 h-24 w-24 rounded-full bg-gradient-to-br from-nurture-sage/20 via-nurture-blush/30 to-nurture-cream" />
          <h1 className="font-serif text-3xl font-semibold leading-tight text-nurture-charcoal sm:text-4xl">
            Personalized support for every stage of motherhood.
          </h1>
          <p className="mt-4 text-nurture-charcoal/70">
            A few gentle questions help us understand your journey and recommend
            the right support — at your pace, one step at a time.
          </p>
          <button type="button" onClick={goNext} className={`mt-10 ${primaryButtonClass}`}>
            Start Your Support Journey
          </button>
          <p className="mt-6 text-sm text-nurture-charcoal/50">
            Already have an account?{" "}
            <Link href="/dashboard" className="font-medium text-nurture-sage-dark hover:underline">
              Go to dashboard
            </Link>
          </p>
        </div>
      ) : null}

      {currentStepId === "maternal-stage" ? (
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Where are you in your journey?
          </h2>
          <p className="mt-2 text-sm text-nurture-charcoal/60">
            Choose the stage that feels closest to you right now.
          </p>
          <div className="mt-6 space-y-3">
            {MATERNAL_STAGES.map((stage) => (
              <OptionCard
                key={stage.value}
                label={stage.label}
                description={stage.description}
                selected={draft.maternalStage === stage.value}
                onClick={() => {
                  updateDraft({ maternalStage: stage.value });
                  goNext();
                }}
              />
            ))}
          </div>
        </div>
      ) : null}

      {currentStepId === "pregnant-details" ? (
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Tell us about your pregnancy
          </h2>
          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium">
                Due date
              </label>
              <input
                id="dueDate"
                type="date"
                value={draft.dueDate ?? ""}
                onChange={(event) =>
                  updateDraft({ dueDate: event.target.value || null })
                }
                className={inputClassName}
              />
            </div>
            <div>
              <p className="text-sm font-medium">Current trimester</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(["first", "second", "third"] as Trimester[]).map((trimester) => (
                  <OptionCard
                    key={trimester}
                    label={`${trimester.charAt(0).toUpperCase()}${trimester.slice(1)}`}
                    selected={draft.trimester === trimester}
                    onClick={() => updateDraft({ trimester })}
                  />
                ))}
              </div>
            </div>
          </div>
          <button type="button" onClick={goNext} className={`mt-8 ${primaryButtonClass}`}>
            Continue
          </button>
        </div>
      ) : null}

      {currentStepId === "postpartum-details" ? (
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            How far along are you postpartum?
          </h2>
          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="postpartumWeeks" className="block text-sm font-medium">
                Weeks postpartum
              </label>
              <input
                id="postpartumWeeks"
                type="number"
                min={0}
                max={52}
                placeholder="e.g. 6"
                value={draft.postpartumWeeks ?? ""}
                onChange={(event) =>
                  updateDraft({
                    postpartumWeeks: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="postpartumMonths" className="block text-sm font-medium">
                Months postpartum (optional)
              </label>
              <input
                id="postpartumMonths"
                type="number"
                min={0}
                max={24}
                placeholder="e.g. 3"
                value={draft.postpartumMonths ?? ""}
                onChange={(event) =>
                  updateDraft({
                    postpartumMonths: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }
                className={inputClassName}
              />
            </div>
          </div>
          <button type="button" onClick={goNext} className={`mt-8 ${primaryButtonClass}`}>
            Continue
          </button>
        </div>
      ) : null}

      {currentStepId === "care-interests" ? (
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            What kind of support are you looking for?
          </h2>
          <p className="mt-2 text-sm text-nurture-charcoal/60">
            Select all that apply — we&apos;ll personalize your recommendations.
          </p>
          <div className="mt-6 space-y-3">
            {SUPPORT_INTERESTS.map((interest) => (
              <OptionCard
                key={interest.value}
                type="multi"
                label={interest.label}
                description={interest.description}
                selected={draft.supportInterests?.includes(interest.value)}
                onClick={() =>
                  updateDraft({
                    supportInterests: toggleItem(
                      draft.supportInterests ?? [],
                      interest.value
                    ),
                  })
                }
              />
            ))}
          </div>
          <button
            type="button"
            onClick={goNext}
            disabled={!draft.supportInterests?.length}
            className={`mt-8 ${primaryButtonClass}`}
          >
            Continue
          </button>
        </div>
      ) : null}

      {currentStepId === "challenges" ? (
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            What&apos;s feeling hardest right now?
          </h2>
          <p className="mt-2 text-sm text-nurture-charcoal/60">
            There&apos;s no wrong answer — this helps us prioritize your support.
          </p>
          <div className="mt-6 space-y-3">
            {CHALLENGE_OPTIONS.map((challenge) => (
              <OptionCard
                key={challenge.value}
                type="multi"
                label={challenge.label}
                selected={draft.challenges?.includes(challenge.value)}
                onClick={() =>
                  updateDraft({
                    challenges: toggleItem(
                      (draft.challenges ?? []) as ChallengeOption[],
                      challenge.value
                    ),
                  })
                }
              />
            ))}
          </div>
          <div className="mt-6">
            <label htmlFor="challengesFreeText" className="block text-sm font-medium">
              Anything else on your mind? (optional)
            </label>
            <textarea
              id="challengesFreeText"
              rows={4}
              placeholder="Share what's on your heart..."
              value={draft.challengesFreeText ?? ""}
              onChange={(event) =>
                updateDraft({ challengesFreeText: event.target.value })
              }
              className={inputClassName}
            />
          </div>
          <button type="button" onClick={goNext} className={`mt-8 ${primaryButtonClass}`}>
            Continue
          </button>
        </div>
      ) : null}

      {currentStepId === "scheduling" ? (
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            When works best for you?
          </h2>
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-sm font-medium">Preferred days</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SCHEDULE_DAYS.map((day) => {
                  const selected = draft.preferredSchedule?.days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        updateDraft({
                          preferredSchedule: {
                            ...draft.preferredSchedule!,
                            days: toggleItem(
                              draft.preferredSchedule?.days ?? [],
                              day
                            ),
                          },
                        })
                      }
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        selected
                          ? "bg-nurture-sage text-white"
                          : "border border-nurture-sage/25 bg-white text-nurture-charcoal/70 hover:border-nurture-sage/50"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Preferred times</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SCHEDULE_TIMES.map((time) => {
                  const selected = draft.preferredSchedule?.times.includes(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() =>
                        updateDraft({
                          preferredSchedule: {
                            ...draft.preferredSchedule!,
                            times: toggleItem(
                              draft.preferredSchedule?.times ?? [],
                              time
                            ),
                          },
                        })
                      }
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        selected
                          ? "bg-nurture-sage text-white"
                          : "border border-nurture-sage/25 bg-white text-nurture-charcoal/70 hover:border-nurture-sage/50"
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Virtual or in-person?</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["virtual", "Virtual"],
                    ["in-person", "In-person"],
                    ["either", "Either"],
                  ] as [ScheduleModality, string][]
                ).map(([value, label]) => (
                  <OptionCard
                    key={value}
                    label={label}
                    selected={draft.preferredSchedule?.modality === value}
                    onClick={() =>
                      updateDraft({
                        preferredSchedule: {
                          ...draft.preferredSchedule!,
                          modality: value,
                        },
                      })
                    }
                  />
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium">
                Timezone
              </label>
              <input
                id="timezone"
                type="text"
                value={draft.preferredSchedule?.timezone ?? DEFAULT_TIMEZONE}
                onChange={(event) =>
                  updateDraft({
                    preferredSchedule: {
                      ...draft.preferredSchedule!,
                      timezone: event.target.value,
                    },
                  })
                }
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="locationZip" className="block text-sm font-medium">
                Location ZIP code
              </label>
              <input
                id="locationZip"
                type="text"
                inputMode="numeric"
                placeholder="07030"
                value={draft.locationZip ?? ""}
                onChange={(event) =>
                  updateDraft({ locationZip: event.target.value })
                }
                className={inputClassName}
              />
            </div>
          </div>
          <button type="button" onClick={goNext} className={`mt-8 ${primaryButtonClass}`}>
            Continue
          </button>
        </div>
      ) : null}

      {currentStepId === "insurance" ? (
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Insurance & budget
          </h2>
          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="insuranceProvider" className="block text-sm font-medium">
                Insurance provider (optional)
              </label>
              <input
                id="insuranceProvider"
                type="text"
                placeholder="e.g. Aetna, Blue Cross"
                value={draft.insuranceProvider ?? ""}
                onChange={(event) =>
                  updateDraft({ insuranceProvider: event.target.value })
                }
                className={inputClassName}
              />
            </div>
            <div>
              <p className="text-sm font-medium">
                Interested in insurance-covered services?
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    [true, "Yes, please"],
                    [false, "Not right now"],
                  ] as [boolean, string][]
                ).map(([value, label]) => (
                  <OptionCard
                    key={String(value)}
                    label={label}
                    selected={draft.insuranceInterested === value}
                    onClick={() =>
                      updateDraft({ insuranceInterested: value as boolean })
                    }
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Budget preference</p>
              <div className="mt-3 space-y-3">
                {BUDGET_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    selected={draft.budgetPreference === option.value}
                    onClick={() =>
                      updateDraft({
                        budgetPreference: option.value as BudgetPreference,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          </div>
          <button type="button" onClick={goNext} className={`mt-8 ${primaryButtonClass}`}>
            Continue
          </button>
        </div>
      ) : null}

      {currentStepId === "contact" ? (
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            How can we reach you?
          </h2>
          <p className="mt-2 text-sm text-nurture-charcoal/60">
            Your coordinator will use this to connect you with support.
          </p>
          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={draft.name ?? ""}
                onChange={(event) => updateDraft({ name: event.target.value })}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                readOnly
                value={draft.email ?? ""}
                className="mt-2 w-full rounded-xl border border-nurture-sage/15 bg-nurture-cream/60 px-4 py-3 text-sm text-nurture-charcoal/70"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                required
                placeholder="+12065550100"
                value={draft.phone ?? ""}
                onChange={(event) => updateDraft({ phone: event.target.value })}
                className={inputClassName}
              />
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-nurture-sage/20 bg-white p-4">
              <input
                type="checkbox"
                checked={draft.smsConsent ?? false}
                onChange={(event) =>
                  updateDraft({ smsConsent: event.target.checked })
                }
                className="mt-1 h-4 w-4 rounded border-nurture-sage/40 text-nurture-sage focus:ring-nurture-sage"
              />
              <span className="text-sm text-nurture-charcoal/80">
                I agree to receive SMS updates about my support coordination. Message
                and data rates may apply.
              </span>
            </label>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`mt-8 ${primaryButtonClass}`}
          >
            {submitting ? "Starting your journey…" : "Complete intake"}
          </button>
        </div>
      ) : null}
    </IntakeShell>
  );
};

export default IntakeFlow;
