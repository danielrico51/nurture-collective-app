/** Small decorative leaf used on service cards (mockup-style). */
const LeafMark = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    aria-hidden
    fill="none"
  >
    <path
      d="M12 3C8 8 5 12 6 17C7 20 10 21 12 21C14 21 17 20 18 17C19 12 16 8 12 3Z"
      fill="#9BB5A0"
      opacity="0.85"
    />
    <path
      d="M12 3V21"
      stroke="#8B7BA8"
      strokeWidth="1"
      opacity="0.5"
    />
  </svg>
);

export default LeafMark;
