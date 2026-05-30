import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { normalizePhone } from "@/lib/intake/submitService";

const LOCAL_PATH = path.join(process.cwd(), ".data", "sms", "opt-outs.json");

type OptOutStore = {
  phones: string[];
};

const loadStore = async (): Promise<OptOutStore> => {
  try {
    const raw = await readFile(LOCAL_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<OptOutStore>;
    return { phones: Array.isArray(parsed.phones) ? parsed.phones : [] };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return { phones: [] };
    throw error;
  }
};

const saveStore = async (store: OptOutStore): Promise<void> => {
  await mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await writeFile(LOCAL_PATH, JSON.stringify(store, null, 2), "utf8");
};

const normalizeStoredPhone = (phone: string): string => normalizePhone(phone);

export const isSmsOptedOut = async (phone: string): Promise<boolean> => {
  const normalized = normalizeStoredPhone(phone);
  if (!normalized) return false;
  const store = await loadStore();
  return store.phones.includes(normalized);
};

export const recordSmsOptOut = async (phone: string): Promise<void> => {
  const normalized = normalizeStoredPhone(phone);
  if (!normalized) return;
  const store = await loadStore();
  if (store.phones.includes(normalized)) return;
  store.phones.push(normalized);
  await saveStore(store);
};

export const clearSmsOptOut = async (phone: string): Promise<void> => {
  const normalized = normalizeStoredPhone(phone);
  if (!normalized) return;
  const store = await loadStore();
  store.phones = store.phones.filter((entry) => entry !== normalized);
  await saveStore(store);
};
