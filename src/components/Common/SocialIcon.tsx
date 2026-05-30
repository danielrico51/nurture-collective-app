type SocialNetwork = "instagram" | "facebook" | "sms";

interface SocialIconProps {
  network: SocialNetwork;
  className?: string;
}

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.25" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.6c0-.9.2-1.5 1.5-1.5H16.6V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.4v2.5H8v3.1h2V22h3.5z" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.5 4.8c0-.7.5-1.2 1.1-1.3l1.9-.3c.5-.1 1 .2 1.2.7l1 2.4c.2.5 0 1.1-.5 1.4l-1.3.8c1 1.9 2.6 3.5 4.5 4.5l.8-1.3c.3-.5.9-.7 1.4-.5l2.4 1c.5.2.8.7.7 1.2l-.3 1.9c-.1.6-.6 1.1-1.3 1.1C10.8 18.8 5.2 13.2 6.5 4.8z"
    />
  </svg>
);

export function SocialIcon({ network, className = "h-6 w-6" }: SocialIconProps) {
  if (network === "instagram") return <InstagramIcon className={className} />;
  if (network === "sms") return <PhoneIcon className={className} />;
  return <FacebookIcon className={className} />;
}
