import { careCoordinator } from "@/content/site";

const TypingIndicator = () => (
  <div
    className="flex items-center gap-1.5 px-4 py-3"
    aria-label={careCoordinator.intake.typing}
  >
    {[0, 1, 2].map((index) => (
      <span
        key={index}
        className="h-2 w-2 animate-bounce rounded-full bg-nurture-sage/70"
        style={{ animationDelay: `${index * 0.15}s` }}
      />
    ))}
  </div>
);

export default TypingIndicator;
