interface AdminTabBarProps<T extends string> {
  tabs: ReadonlyArray<{ id: T; label: string; disabled?: boolean }>;
  active: T;
  onChange: (tab: T) => void;
  className?: string;
}

const AdminTabBar = <T extends string>({
  tabs,
  active,
  onChange,
  className = "",
}: AdminTabBarProps<T>) => (
  <div
    className={`flex flex-wrap gap-2 border-b border-nurture-sage/15 pb-3 ${className}`}
    role="tablist"
  >
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={active === tab.id}
        disabled={tab.disabled}
        onClick={() => onChange(tab.id)}
        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
          active === tab.id
            ? "bg-nurture-sage text-white"
            : "border border-nurture-sage/25 text-nurture-sage-dark hover:bg-nurture-sage/10"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default AdminTabBar;
