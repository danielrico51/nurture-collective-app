interface ProfileProgressBarProps {
  score: number;
  label?: string;
}

const ProfileProgressBar = ({
  score,
  label = "Building your care profile",
}: ProfileProgressBarProps) => (
  <div className="border-b border-nurture-sage/10 bg-white/80 px-4 py-2 backdrop-blur-sm sm:py-3">
    <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-nurture-charcoal/60">
          {label}
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-nurture-sage/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-nurture-sage to-nurture-blush transition-all duration-700"
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      </div>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-nurture-sage-dark">
        {Math.round(score)}%
      </span>
    </div>
  </div>
);

export default ProfileProgressBar;
