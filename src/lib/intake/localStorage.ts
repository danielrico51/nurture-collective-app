import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { IntakeDocument } from "@/types/intake";
import { normalizeProfile } from "@/lib/intake/normalize";

const LOCAL_DIR = path.join(process.cwd(), ".data", "management");
const LOCAL_FILE = path.join(LOCAL_DIR, "intake.json");

const emptyDocument = (): IntakeDocument => ({
  version: 1,
  profiles: [],
  recommendations: [],
  updatedAt: new Date().toISOString(),
});

export const readLocalIntakeDocument = async (): Promise<IntakeDocument> => {
  try {
    const body = await readFile(LOCAL_FILE, "utf8");
    const parsed = JSON.parse(body) as IntakeDocument;
    if (!Array.isArray(parsed.profiles)) return emptyDocument();
    return {
      ...parsed,
      profiles: parsed.profiles.map((profile) => normalizeProfile(profile)),
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : [],
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return emptyDocument();
    throw error;
  }
};

export const writeLocalIntakeDocument = async (
  document: IntakeDocument
): Promise<void> => {
  await mkdir(LOCAL_DIR, { recursive: true });
  const payload: IntakeDocument = {
    ...document,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(LOCAL_FILE, JSON.stringify(payload, null, 2), "utf8");
};
