"use client";

import { fetchIntake } from "@/lib/api/intakeClient";
import type { IntakeApiResponse } from "@/types/intake";
import { useCallback, useEffect, useState } from "react";

const emptyIntake = (): IntakeApiResponse => ({
  profile: null,
  recommendations: [],
});

/** Loads member intake from partitioned storage; refreshes when tab regains focus. */
export const useMemberIntake = (enabled: boolean) => {
  const [intake, setIntake] = useState<IntakeApiResponse | null>(null);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    if (!enabled) {
      setIntake(null);
      setLoading(false);
      return emptyIntake();
    }

    setLoading(true);
    try {
      const data = await fetchIntake();
      setIntake(data);
      return data;
    } catch {
      const fallback = emptyIntake();
      setIntake(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!enabled) return;

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        reload();
      }
    };

    window.addEventListener("focus", reload);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.removeEventListener("focus", reload);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [enabled, reload]);

  return { intake, loading, reload };
};
