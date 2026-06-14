import type { TeamMember } from "@/types/teamMember";

interface LeadCoordinatorSelectProps {
  value: string;
  members: TeamMember[];
  membersLoading?: boolean;
  disabled?: boolean;
  onChange: (coordinatorId: string) => void;
  className?: string;
  label?: string;
  id?: string;
}

const LeadCoordinatorSelect = ({
  value,
  members,
  membersLoading = false,
  disabled = false,
  onChange,
  className = "",
  label = "Assigned coordinator",
  id,
}: LeadCoordinatorSelectProps) => (
  <label className={`block ${className}`.trim()}>
    <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
      {label}
    </span>
    <select
      id={id}
      value={value}
      disabled={disabled || membersLoading}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage disabled:opacity-60"
    >
      <option value="">Unassigned</option>
      {members.map((member) => (
        <option key={member.id} value={member.id}>
          {member.label}
          {member.email ? ` (${member.email})` : ""}
        </option>
      ))}
    </select>
    {membersLoading ? (
      <p className="mt-1 text-xs text-nurture-charcoal/50">Loading admin team…</p>
    ) : null}
  </label>
);

export default LeadCoordinatorSelect;
