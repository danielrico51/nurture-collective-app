import { fetchWithRetry } from "@/lib/api/fetchWithRetry";
import { fetchAuthSession } from "aws-amplify/auth";
import type { MemberPurchasesResponse } from "@/types/memberPurchases";

const authHeaders = async (): Promise<HeadersInit> => {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) {
    throw new Error("Not authenticated");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const fetchMemberPurchases = async (): Promise<MemberPurchasesResponse> => {
  const response = await fetchWithRetry("/api/member/purchases", {
    headers: await authHeaders(),
    cache: "no-store",
  });
  const data = (await response.json()) as MemberPurchasesResponse & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Could not load purchases");
  }
  return data;
};
