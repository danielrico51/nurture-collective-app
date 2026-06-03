export interface JournalPrompt {
  id: string;
  text: string;
  stages?: string[];
}

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  {
    id: "need-today",
    text: "What do you need most today — rest, connection, information, or something else?",
  },
  {
    id: "small-win",
    text: "Name one small thing that went okay today, even if the day was hard.",
  },
  {
    id: "ivf-feeling",
    text: "How are you feeling about your fertility journey right now?",
    stages: ["trying-to-conceive"],
  },
  {
    id: "body-trust",
    text: "What is one way your body supported you recently?",
    stages: ["pregnant", "newly-postpartum"],
  },
  {
    id: "support",
    text: "Who could you reach out to this week, and what would you ask for?",
  },
];

export const pickDailyPrompt = (stage: string | null): JournalPrompt => {
  const matched = JOURNAL_PROMPTS.filter(
    (p) => !p.stages || (stage && p.stages.includes(stage))
  );
  const pool = matched.length > 0 ? matched : JOURNAL_PROMPTS;
  const dayIndex = new Date().getDate() % pool.length;
  return pool[dayIndex];
};
