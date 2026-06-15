"use client";

import {
  resolveRegistrationSourceFromSearchParams,
  storeRegistrationSource,
} from "@/lib/classRegistrations/attribution";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** Persists `?source=google_business` (or utm) for the registration form. */
const ClassRegistrationSourceTracker = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const source = resolveRegistrationSourceFromSearchParams(searchParams);
    if (source) storeRegistrationSource(source);
  }, [searchParams]);

  return null;
};

export default ClassRegistrationSourceTracker;
