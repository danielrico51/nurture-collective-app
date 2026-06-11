/** Split `"The Nesting Place <info@nesting-place.com>"` into display name + address. */
export const parseEmailFromHeader = (
  from: string
): { email: string; displayName?: string } => {
  const trimmed = from.trim();
  const bracketMatch = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (bracketMatch) {
    return {
      displayName: bracketMatch[1].trim().replace(/^["']|["']$/g, ""),
      email: bracketMatch[2].trim(),
    };
  }
  return { email: trimmed };
};
