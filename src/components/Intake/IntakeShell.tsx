import IntakeProgress from "@/components/Intake/IntakeProgress";

interface IntakeShellProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  stepLabel?: string;
  onBack?: () => void;
  showBack?: boolean;
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-nurture-sage/30 px-4 py-3 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage";

const IntakeShell = ({
  children,
  currentStep,
  totalSteps,
  stepLabel,
  onBack,
  showBack = true,
}: IntakeShellProps) => (
  <div className="mx-auto min-h-[70vh] max-w-lg px-4 py-8 sm:py-12">
    <div className="mb-8">
      <IntakeProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        label={stepLabel}
      />
    </div>

    <div className="animate-[fadeIn_0.35s_ease-out]">{children}</div>

    {showBack && onBack && currentStep > 1 ? (
      <button
        type="button"
        onClick={onBack}
        className="mt-8 text-sm font-medium text-nurture-charcoal/50 transition hover:text-nurture-sage-dark"
      >
        ← Back
      </button>
    ) : null}
  </div>
);

export { inputClassName };
export default IntakeShell;
