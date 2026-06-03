/**
 * Seeds a rich demo wellness journal for a Cognito user (S3 + local media).
 *
 * Usage:
 *   JOURNAL_DEMO_USER_SUB=7408b458-4041-707d-a3fc-95674fca5746 npx tsx scripts/seed-journal-demo.ts
 *
 * Requires AWS credentials and TASKS_S3_BUCKET (or INTAKE_S3_BUCKET) in .env.local.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getServerCredentials } from "../src/lib/aws/amplifyCredentials";
import { sanitizePartitionSegment } from "../src/lib/intake/partitions";
import { JOURNAL_PARTITION_PREFIX } from "../src/lib/journal/keys";
import type {
  JournalEntry,
  JournalEntryIndex,
  JournalEntryIndexItem,
  JournalProfile,
  JournalTimelineStore,
  JourneyTimelineEvent,
} from "../src/types/journal";

const loadEnvFile = (filename: string) => {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
};

loadEnvFile(".env.local");
loadEnvFile(".env");

const USER_SUB =
  process.env.JOURNAL_DEMO_USER_SUB?.trim() ||
  "7408b458-4041-707d-a3fc-95674fca5746";

const userKey = sanitizePartitionSegment(USER_SUB);
const prefix = `${JOURNAL_PARTITION_PREFIX}user=${userKey}/`;

const getBucket = () =>
  process.env.TASKS_S3_BUCKET?.trim() ||
  process.env.INTAKE_S3_BUCKET?.trim() ||
  "nurture-collective-tasks";

const getClient = () =>
  new S3Client({
    region: process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1",
    credentials: getServerCredentials(),
  });

const putJson = async (key: string, payload: unknown) => {
  const Bucket = getBucket();
  await getClient().send(
    new PutObjectCommand({
      Bucket,
      Key: key,
      Body: JSON.stringify(payload, null, 2),
      ContentType: "application/json",
    })
  );
  console.log(`  s3://${Bucket}/${key}`);
};

const putBytes = async (key: string, body: Buffer, contentType: string) => {
  const Bucket = getBucket();
  await getClient().send(
    new PutObjectCommand({
      Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "private, max-age=3600",
    })
  );
  console.log(`  s3://${Bucket}/${key}`);
};

const iso = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d, 14, 0, 0)).toISOString().replace("+00:00", "Z");

const mediaUrl = (filename: string) =>
  `/api/journal/media/${encodeURIComponent(userKey)}/${encodeURIComponent(filename)}`;

/** Fetch small royalty-free placeholders (Picsum). */
const fetchPhoto = async (seed: string): Promise<Buffer> => {
  const response = await fetch(`https://picsum.photos/seed/${seed}/400/400`, {
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Photo fetch failed: ${seed}`);
  return Buffer.from(await response.arrayBuffer());
};

const main = async () => {
  console.log(`Seeding journal demo for sub ${USER_SUB} (key: ${userKey})`);

  const photoSeeds = [
    { seed: "nurture-journal-ttc", filename: "memory-ttc-start.jpg" },
    { seed: "nurture-journal-ivf", filename: "memory-ivf-clinic.jpg" },
    { seed: "nurture-journal-test", filename: "memory-positive-test.jpg" },
    { seed: "nurture-journal-scan", filename: "memory-anatomy-scan.jpg" },
    { seed: "nurture-journal-baby", filename: "memory-baby-arrival.jpg" },
  ];

  const imageUrls: Record<string, string> = {};
  console.log("\nUploading photos…");
  for (const { seed, filename } of photoSeeds) {
    const buffer = await fetchPhoto(seed);
    const key = `${prefix}media/${filename}`;
    await putBytes(key, buffer, "image/jpeg");
    imageUrls[filename] = mediaUrl(filename);
  }

  const now = new Date().toISOString();
  const profile: JournalProfile = {
    version: 1,
    userId: USER_SUB,
    createdAt: iso(2025, 10, 1),
    updatedAt: now,
    maternalStage: "newly-postpartum",
    journeyPath: "ivf",
    dueDate: "2026-05-18",
    dueDateSource: "confirmed",
    postpartumWeeks: 3,
    babyBirthDate: "2026-05-18",
    pregnancyNotes: "IVF cycle 2 · transfer Feb 2026",
    displayNameInJournal: "Maya",
    preferences: {
      dailyReminder: true,
      reminderLocalTime: "09:00",
      defaultEntryVisibility: "private",
    },
  };

  const timelineEvents: JourneyTimelineEvent[] = [
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2025, 10, 5),
      type: "profile_initialized",
      payload: { source: "demo_seed", label: "Started my wellness journal" },
      createdAt: iso(2025, 10, 5),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2025, 10, 12),
      type: "stage_changed",
      payload: {
        fromStage: null,
        toStage: "trying-to-conceive",
        label: "Began trying to conceive",
      },
      createdAt: iso(2025, 10, 12),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2025, 10, 20),
      type: "memory",
      payload: {
        kind: "memory",
        label: "First journal night — hope & nerves",
        note: "Set up our cozy corner. Wrote three things I'm grateful for, even on hard days.",
        imageUrl: imageUrls["memory-ttc-start.jpg"],
        stage: "trying-to-conceive",
      },
      createdAt: iso(2025, 10, 20),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2025, 11, 8),
      type: "journey_path_set",
      payload: { journeyPath: "ivf", label: "Chose IVF path with our clinic" },
      createdAt: iso(2025, 11, 8),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2025, 11, 15),
      type: "memory",
      payload: {
        kind: "memory",
        label: "Egg retrieval day",
        note: "Exhausted but proud. Partner brought socks and bad jokes.",
        imageUrl: imageUrls["memory-ivf-clinic.jpg"],
        stage: "trying-to-conceive",
      },
      createdAt: iso(2025, 11, 15),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2025, 12, 1),
      type: "reminder",
      payload: {
        kind: "reminder",
        label: "Call clinic for transfer prep checklist",
        note: "Ask about progesterone timing and travel.",
        reminderAt: iso(2026, 1, 10),
        stage: "trying-to-conceive",
      },
      createdAt: iso(2025, 12, 1),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2026, 1, 28),
      type: "ivf_milestone",
      payload: { label: "Embryo transfer", note: "Two-week wait begins." },
      createdAt: iso(2026, 1, 28),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2026, 2, 14),
      type: "memory",
      payload: {
        kind: "memory",
        label: "Positive test at sunrise",
        note: "Hands shaking. Texted our group chat a single heart.",
        imageUrl: imageUrls["memory-positive-test.jpg"],
        stage: "trying-to-conceive",
      },
      createdAt: iso(2026, 2, 14),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2026, 2, 16),
      type: "stage_changed",
      payload: {
        fromStage: "trying-to-conceive",
        toStage: "pregnant",
        label: "Pregnant — first chapter",
      },
      createdAt: iso(2026, 2, 16),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2026, 2, 16),
      type: "due_date_set",
      payload: {
        dueDate: "2026-05-18",
        dueDateSource: "confirmed",
        label: "Due date confirmed",
      },
      createdAt: iso(2026, 2, 16),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2026, 3, 22),
      type: "memory",
      payload: {
        kind: "memory",
        label: "Anatomy scan — little wiggle on screen",
        note: "Found out we're team green. Cried in the parking lot.",
        imageUrl: imageUrls["memory-anatomy-scan.jpg"],
        stage: "pregnant",
      },
      createdAt: iso(2026, 3, 22),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2026, 4, 10),
      type: "reminder",
      payload: {
        kind: "reminder",
        label: "Pack hospital bag",
        reminderAt: iso(2026, 5, 1),
        stage: "pregnant",
      },
      createdAt: iso(2026, 4, 10),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2026, 5, 18),
      type: "baby_born",
      payload: {
        babyBirthDate: "2026-05-18",
        label: "Baby arrived — welcome little one",
      },
      createdAt: iso(2026, 5, 18),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2026, 5, 20),
      type: "memory",
      payload: {
        kind: "memory",
        label: "First days at home",
        note: "Sleep in two-hour stretches. Feet up. Soup from neighbors.",
        imageUrl: imageUrls["memory-baby-arrival.jpg"],
        stage: "newly-postpartum",
      },
      createdAt: iso(2026, 5, 20),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2026, 5, 21),
      type: "stage_changed",
      payload: {
        fromStage: "pregnant",
        toStage: "newly-postpartum",
        label: "Postpartum chapter",
      },
      createdAt: iso(2026, 5, 21),
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      occurredAt: iso(2026, 6, 1),
      type: "custom_milestone",
      payload: {
        label: "First pediatric visit",
        note: "All clear. Remembered to ask about vitamin D.",
      },
      createdAt: iso(2026, 6, 1),
    },
  ];

  const entries: JournalEntry[] = [
    {
      id: randomUUID(),
      userId: USER_SUB,
      entryType: "freeform",
      journalDate: "2025-11-02",
      createdAt: iso(2025, 11, 2),
      updatedAt: null,
      title: "Letters to future us",
      body: "Dear future parents: today we laughed about baby names we will never use. It felt good to dream out loud.",
      mood: 4,
      sleepQuality: null,
      tags: ["ivf", "hope"],
      visibility: "private",
      linkedTimelineEventId: null,
      promptId: null,
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      entryType: "daily_checkin",
      journalDate: "2026-03-15",
      createdAt: iso(2026, 3, 15),
      updatedAt: null,
      title: null,
      body: "Energy is better this week. Nausea only mornings. Walked by the lake — 20 minutes felt like a win.",
      mood: 4,
      sleepQuality: 3,
      tags: [],
      visibility: "private",
      linkedTimelineEventId: null,
      promptId: null,
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      entryType: "daily_checkin",
      journalDate: "2026-05-25",
      createdAt: iso(2026, 5, 25),
      updatedAt: null,
      title: null,
      body: "Mood: Good — sleep was fragmented but partner took the 4am shift. Grateful for that.",
      mood: 4,
      sleepQuality: 2,
      tags: ["postpartum"],
      visibility: "private",
      linkedTimelineEventId: null,
      promptId: null,
    },
    {
      id: randomUUID(),
      userId: USER_SUB,
      entryType: "freeform",
      journalDate: "2026-06-02",
      createdAt: iso(2026, 6, 2),
      updatedAt: null,
      title: "Three weeks in",
      body: "Some days I still can't believe she's here. Today I showered before noon and called it a victory.",
      mood: 5,
      sleepQuality: null,
      tags: [],
      visibility: "private",
      linkedTimelineEventId: null,
      promptId: null,
    },
  ];

  const indexItems: JournalEntryIndexItem[] = entries.map((e) => ({
    id: e.id,
    journalDate: e.journalDate,
    entryType: e.entryType,
    titlePreview:
      e.title?.trim() ||
      e.body.trim().slice(0, 80) ||
      (e.entryType === "daily_checkin" ? "Daily check-in" : "Journal note"),
    mood: e.mood,
    updatedAt: e.createdAt,
  }));

  const timeline: JournalTimelineStore = {
    version: 1,
    userId: USER_SUB,
    events: timelineEvents,
    updatedAt: now,
  };

  const index: JournalEntryIndex = {
    version: 1,
    userId: USER_SUB,
    items: indexItems,
    updatedAt: now,
  };

  console.log("\nUploading journal JSON…");
  await putJson(`${prefix}profile.json`, profile);
  await putJson(`${prefix}timeline.json`, timeline);
  await putJson(`${prefix}index.json`, index);

  for (const entry of entries) {
    await putJson(`${prefix}entries/${entry.id}.json`, entry);
  }

  console.log("\nDone.");
  console.log(`  Profile: newly-postpartum · IVF path · display name Maya`);
  console.log(`  Timeline: ${timelineEvents.length} events (memories, reminders, milestones)`);
  console.log(`  Entries: ${entries.length} journal notes`);
  console.log(`  Photos: ${photoSeeds.length}`);
  console.log(`\nOpen https://dev.d9588bqvrp5xs.amplifyapp.com/apps/journal (or local) signed in as you.`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
