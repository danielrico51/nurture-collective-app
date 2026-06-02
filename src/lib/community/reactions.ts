export const REACTION_TYPES = [
  "like",
  "love",
  "care",
  "haha",
  "wow",
  "sad",
  "angry",
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

export interface PostReactions {
  total: number;
  counts: Partial<Record<ReactionType, number>>;
  user_reaction: ReactionType | null;
}

export const REACTION_EMOJI: Record<ReactionType, string> = {
  like: "👍",
  love: "❤️",
  care: "🤗",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😠",
};

export const REACTION_LABELS: Record<ReactionType, string> = {
  like: "Like",
  love: "Love",
  care: "Care",
  haha: "Haha",
  wow: "Wow",
  sad: "Sad",
  angry: "Angry",
};

/** Order for stacked summary icons (most common first). */
export const REACTION_SUMMARY_ORDER: ReactionType[] = [
  "like",
  "love",
  "care",
  "haha",
  "wow",
  "sad",
  "angry",
];

export const emptyReactions = (): PostReactions => ({
  total: 0,
  counts: {},
  user_reaction: null,
});

export const topReactionTypes = (
  counts: Partial<Record<ReactionType, number>>,
  limit = 3
): ReactionType[] =>
  REACTION_SUMMARY_ORDER.filter((t) => (counts[t] ?? 0) > 0).slice(0, limit);
