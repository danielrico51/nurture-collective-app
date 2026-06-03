import { getIntakeForUser } from "@/lib/intake/storage";
import {
  createEmptyJournalProfile,
  normalizeJournalProfile,
} from "@/lib/journal/normalize";
import type { JournalProfile } from "@/types/journal";
import type { JourneyPath } from "@/lib/community/journeyStages";

export const seedJournalProfileFromIntake = async (
  userId: string,
  email?: string | null
): Promise<JournalProfile | null> => {
  try {
    const intake = await getIntakeForUser(userId, email);
    const profile = intake.profile;
    if (!profile?.maternalStage && !profile?.dueDate) {
      return null;
    }

    const base = createEmptyJournalProfile(userId);
    const journeyPath: JourneyPath | null = null;

    return normalizeJournalProfile(
      {
        ...base,
        maternalStage: profile.maternalStage,
        journeyPath,
        dueDate: profile.dueDate?.slice(0, 10) ?? null,
        dueDateSource: profile.dueDate ? "confirmed" : null,
        postpartumWeeks: profile.postpartumWeeks,
        displayNameInJournal: profile.name?.split(" ")[0] ?? null,
        updatedAt: new Date().toISOString(),
      },
      userId
    );
  } catch {
    return null;
  }
};
