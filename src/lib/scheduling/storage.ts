import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  listS3ObjectKeysWithPrefix,
  readS3ObjectJson,
  writeS3ObjectJson,
} from "@/lib/intake/s3Storage";
import { getIntakeStorageMode } from "@/lib/intake/storage";
import { resolveStorageUserKey } from "@/lib/intake/partitions";
import type { ConsultBooking } from "@/lib/scheduling/types";

const LOCAL_ROOT = path.join(process.cwd(), ".data");

const buildUserBookingsPrefix = (userId: string) =>
  `management/process=intake/user=${resolveStorageUserKey(userId)}/bookings/`;

const buildBookingKey = (userId: string, bookingId: string) =>
  `${buildUserBookingsPrefix(userId)}${bookingId}.json`;

const localPathForKey = (key: string) => path.join(LOCAL_ROOT, key);

const readLocalBooking = async (key: string): Promise<ConsultBooking | null> => {
  try {
    const body = await readFile(localPathForKey(key), "utf8");
    return JSON.parse(body) as ConsultBooking;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return null;
    throw error;
  }
};

const writeLocalBooking = async (
  key: string,
  booking: ConsultBooking
): Promise<void> => {
  const filePath = localPathForKey(key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(booking, null, 2), "utf8");
};

const idempotencyKey = (userId: string, key: string) =>
  `management/process=intake/user=${resolveStorageUserKey(userId)}/bookings/idempotency/${key}.json`;

export const findBookingByIdempotencyKey = async (
  userId: string,
  key: string
): Promise<ConsultBooking | null> => {
  const storageKey = idempotencyKey(userId, key);
  if (getIntakeStorageMode() === "s3") {
    return readS3ObjectJson<ConsultBooking>(storageKey);
  }
  return readLocalBooking(storageKey);
};

export const saveBookingIdempotency = async (
  userId: string,
  key: string,
  booking: ConsultBooking
): Promise<void> => {
  const storageKey = idempotencyKey(userId, key);
  if (getIntakeStorageMode() === "s3") {
    await writeS3ObjectJson(storageKey, booking);
    return;
  }
  await writeLocalBooking(storageKey, booking);
};

export const saveConsultBooking = async (
  booking: ConsultBooking
): Promise<ConsultBooking> => {
  const key = buildBookingKey(booking.userId, booking.id);
  if (getIntakeStorageMode() === "s3") {
    await writeS3ObjectJson(key, booking);
    return booking;
  }
  await writeLocalBooking(key, booking);
  return booking;
};

const listLocalBookingKeys = async (userId: string): Promise<string[]> => {
  const prefix = buildUserBookingsPrefix(userId);
  const dir = localPathForKey(prefix);
  const keys: string[] = [];

  const walk = async (currentDir: string, relative: string) => {
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") return;
      throw error;
    }

    for (const entry of entries) {
      if (entry.name === "idempotency") continue;
      const entryRelative = `${relative}${entry.name}`;
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, `${entryRelative}/`);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        keys.push(`${prefix}${entryRelative}`);
      }
    }
  };

  await walk(dir, "");
  return keys;
};

export const listConsultBookingsForUser = async (
  userId: string
): Promise<ConsultBooking[]> => {
  if (getIntakeStorageMode() === "s3") {
    const prefix = buildUserBookingsPrefix(userId);
    const keys = (await listS3ObjectKeysWithPrefix(prefix)).filter(
      (key) => key.endsWith(".json") && !key.includes("/idempotency/")
    );
    const bookings = await Promise.all(
      keys.map((key) => readS3ObjectJson<ConsultBooking>(key))
    );
    return bookings.filter((booking): booking is ConsultBooking => booking !== null);
  }

  const keys = await listLocalBookingKeys(userId);
  const bookings = await Promise.all(keys.map((key) => readLocalBooking(key)));
  return bookings.filter((booking): booking is ConsultBooking => booking !== null);
};

export const findConfirmedBookingForConversation = async (
  userId: string,
  conversationSessionId: string
): Promise<ConsultBooking | null> => {
  const bookings = await listConsultBookingsForUser(userId);
  return (
    bookings
      .filter(
        (booking) =>
          booking.status === "confirmed" &&
          booking.conversationSessionId === conversationSessionId
      )
      .sort(
        (left, right) =>
          new Date(right.start).getTime() - new Date(left.start).getTime()
      )[0] ?? null
  );
};
