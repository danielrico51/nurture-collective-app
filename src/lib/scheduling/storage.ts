import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { readS3ObjectJson, writeS3ObjectJson } from "@/lib/intake/s3Storage";
import { getIntakeStorageMode } from "@/lib/intake/storage";
import { resolveStorageUserKey } from "@/lib/intake/partitions";
import type { ConsultBooking } from "@/lib/scheduling/types";

const LOCAL_ROOT = path.join(process.cwd(), ".data");

const buildBookingKey = (userId: string, bookingId: string) =>
  `management/process=intake/user=${resolveStorageUserKey(userId)}/bookings/${bookingId}.json`;

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
