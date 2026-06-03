export const isJournalLocalStorageEnabled = (): boolean => {
  if (process.env.JOURNAL_USE_LOCAL_STORAGE === "true") return true;
  if (process.env.JOURNAL_S3_BUCKET?.trim()) return false;
  if (process.env.INTAKE_S3_BUCKET?.trim()) return false;
  if (process.env.TASKS_S3_BUCKET?.trim()) return false;
  return process.env.NODE_ENV === "development";
};

export const getJournalStorageMode = (): "local" | "s3" =>
  isJournalLocalStorageEnabled() ? "local" : "s3";
