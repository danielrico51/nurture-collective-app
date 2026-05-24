interface AuthCardHeaderProps {
  title: string;
  subtitle: string;
  icon?: "signin" | "signup" | "password";
}

function AuthIcon({ icon }: { icon: AuthCardHeaderProps["icon"] }) {
  if (icon === "signup") {
    return (
      <svg
        aria-hidden
        className="h-6 w-6 text-nurture-sage-dark"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
        />
      </svg>
    );
  }

  if (icon === "password") {
    return (
      <svg
        aria-hidden
        className="h-6 w-6 text-nurture-sage-dark"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden
      className="h-6 w-6 text-nurture-sage-dark"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

export function AuthCardHeader({
  title,
  subtitle,
  icon = "signin",
}: AuthCardHeaderProps) {
  return (
    <div className="auth-card-header mb-6 border-b border-nurture-sage/10 pb-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-nurture-sage/25 to-nurture-blush/20">
        <AuthIcon icon={icon} />
      </div>
      <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
        {title}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-nurture-charcoal/65">
        {subtitle}
      </p>
    </div>
  );
}
