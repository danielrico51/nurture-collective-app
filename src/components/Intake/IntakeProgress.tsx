interface IntakeProgressProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
}

const IntakeProgress = ({
  currentStep,
  totalSteps,
  label,
}: IntakeProgressProps) => {
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full">
      {label ? (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-nurture-sage-dark">
          {label}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-nurture-sage/15"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-nurture-sage to-nurture-blush transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-medium tabular-nums text-nurture-charcoal/50">
          {currentStep}/{totalSteps}
        </span>
      </div>
    </div>
  );
};

export default IntakeProgress;
