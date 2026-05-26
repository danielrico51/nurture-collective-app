interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

interface CareChecklistProps {
  items: ChecklistItem[];
}

const CareChecklist = ({ items }: CareChecklistProps) => (
  <div className="rounded-2xl border border-nurture-sage/15 bg-white p-6 shadow-sm">
    <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
      Your support checklist
    </h3>
    <ul className="mt-5 space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
              item.completed
                ? "border-nurture-sage bg-nurture-sage text-white"
                : "border-nurture-sage/30 bg-white"
            }`}
            aria-hidden
          >
            {item.completed ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : null}
          </span>
          <span
            className={`text-sm ${
              item.completed
                ? "text-nurture-charcoal/50 line-through"
                : "text-nurture-charcoal/80"
            }`}
          >
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export default CareChecklist;
