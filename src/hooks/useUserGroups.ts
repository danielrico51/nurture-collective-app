"use client";

import { canAccessAdminApps } from "@/lib/auth/groups";
import { extractGroupsFromSession } from "@/lib/auth/sessionGroups";
import { fetchAuthSession } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { useCallback, useEffect, useState } from "react";

const loadSessionGroups = async (forceRefresh: boolean) => {
  const session = await fetchAuthSession({ forceRefresh });
  return extractGroupsFromSession(session);
};

export const useUserGroups = (isAuthenticated: boolean) => {
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [refreshing, setRefreshing] = useState(false);

  const refreshGroups = useCallback(async () => {
    setRefreshing(true);
    try {
      const nextGroups = await loadSessionGroups(true);
      setGroups(nextGroups);
      return nextGroups;
    } catch {
      setGroups([]);
      return [];
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setGroups([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        let nextGroups = await loadSessionGroups(false);
        if (nextGroups.length === 0) {
          nextGroups = await loadSessionGroups(true);
        }
        if (!cancelled) setGroups(nextGroups);
      } catch {
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (
        payload.event === "signedIn" ||
        payload.event === "tokenRefresh" ||
        payload.event === "signedOut"
      ) {
        if (payload.event === "signedOut") {
          setGroups([]);
          setLoading(false);
          return;
        }
        load();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isAuthenticated]);

  return {
    groups,
    loading,
    refreshing,
    canAccessAdmin: canAccessAdminApps(groups),
    /** @deprecated Use canAccessAdmin */
    canAccessTasks: canAccessAdminApps(groups),
    refreshGroups,
  };
};
