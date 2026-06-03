import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const LOCAL_ROOT = path.join(process.cwd(), ".data");

const localPathForKey = (key: string) => path.join(LOCAL_ROOT, key);

export const readLocalJson = async <T>(key: string): Promise<T | null> => {
  try {
    const body = await readFile(localPathForKey(key), "utf8");
    return JSON.parse(body) as T;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return null;
    throw error;
  }
};

export const writeLocalJson = async (key: string, payload: unknown): Promise<void> => {
  const filePath = localPathForKey(key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
};
