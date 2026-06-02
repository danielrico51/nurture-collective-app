import { authorInitial } from "@/components/Community/discussionHelpers";

interface AuthorAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
}

export function AuthorAvatar({ name, imageUrl, size = "md" }: AuthorAvatarProps) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  if (imageUrl?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className={`${dim} shrink-0 rounded-full border border-nurture-sage/15 object-cover object-center`}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-nurture-sage/20 font-semibold text-nurture-sage-dark ${dim}`}
      aria-hidden
    >
      {authorInitial(name)}
    </span>
  );
}
