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

export type BlogBodyBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string };

export const parseBlogBody = (body: string): BlogBodyBlock[] =>
  body
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) =>
      block.startsWith("## ")
        ? { type: "heading" as const, text: block.slice(3).trim() }
        : { type: "paragraph" as const, text: block }
    );

export const splitBlogBody = (body: string): string[] =>
  parseBlogBody(body)
    .filter((block) => block.type === "paragraph")
    .map((block) => block.text);
