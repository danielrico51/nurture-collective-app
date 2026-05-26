interface QuickReplyChipsProps {
  options: string[];
  disabled?: boolean;
  onSelect: (option: string) => void;
}

const QuickReplyChips = ({
  options,
  disabled = false,
  onSelect,
}: QuickReplyChipsProps) => {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1 pb-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(option)}
          className="rounded-full border border-nurture-sage/30 bg-white px-4 py-2 text-sm font-medium text-nurture-charcoal/80 transition hover:border-nurture-sage hover:bg-nurture-sage/10 disabled:opacity-50"
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default QuickReplyChips;
