export const formatBlogDate = (date: string): string => {
  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return date;
  }
};

export const splitBlogBody = (body: string): string[] =>
  body
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
