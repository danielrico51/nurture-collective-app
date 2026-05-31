import type {
  CommunityListResponse,
  CommunitySummary,
  MyCommunity,
} from "@/lib/api/communityApi";

const DEMO_ORG_ID = "00000000-0000-4000-8000-000000000001";

export const DEMO_COMMUNITIES: CommunitySummary[] = [
  {
    community_id: "10000000-0000-4000-8000-000000000001",
    organization_id: DEMO_ORG_ID,
    name: "Postpartum Support Circle",
    description:
      "A welcoming space for new moms navigating the fourth trimester — sleep, feeding, recovery, and emotional check-ins.",
    visibility: "public",
    tags: ["postpartum", "newborn", "support"],
    member_count: 24,
  },
  {
    community_id: "10000000-0000-4000-8000-000000000002",
    organization_id: DEMO_ORG_ID,
    name: "First-Time Moms",
    description:
      "Questions, milestones, and encouragement for moms expecting or welcoming their first baby.",
    visibility: "public",
    tags: ["pregnancy", "first-time", "questions"],
    member_count: 18,
  },
  {
    community_id: "10000000-0000-4000-8000-000000000003",
    organization_id: DEMO_ORG_ID,
    name: "Working Moms Network",
    description:
      "Balancing career and motherhood — return-to-work, pumping, childcare, and boundary-setting.",
    visibility: "public",
    tags: ["working", "career", "balance"],
    member_count: 31,
  },
  {
    community_id: "10000000-0000-4000-8000-000000000004",
    organization_id: DEMO_ORG_ID,
    name: "NICU & Special Care Parents",
    description:
      "Peer support for families with babies in the NICU or with complex medical needs.",
    visibility: "public",
    tags: ["nicu", "special-care", "support"],
    member_count: 12,
  },
  {
    community_id: "10000000-0000-4000-8000-000000000005",
    organization_id: DEMO_ORG_ID,
    name: "Northern NJ Local Moms",
    description:
      "Connect with moms in Bergen, Essex, Hudson, and nearby counties — meetups, referrals, and local resources.",
    visibility: "public",
    tags: ["local", "new-jersey", "meetups"],
    member_count: 42,
  },
];

export const DEMO_MEMBERSHIP_STORAGE_KEY = "nurture-community-demo-memberships";

export const getDemoListResponse = (): CommunityListResponse => ({
  count: DEMO_COMMUNITIES.length,
  next: null,
  previous: null,
  results: DEMO_COMMUNITIES,
});

export const getDemoCommunityById = (communityId: string): CommunitySummary | undefined =>
  DEMO_COMMUNITIES.find((community) => community.community_id === communityId);

export const readDemoMembershipIds = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_MEMBERSHIP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
};

export const writeDemoMembershipIds = (communityIds: string[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    DEMO_MEMBERSHIP_STORAGE_KEY,
    JSON.stringify(communityIds)
  );
};

export const getDemoMyCommunities = (): MyCommunity[] => {
  const joinedIds = new Set(readDemoMembershipIds());
  return DEMO_COMMUNITIES.filter((community) =>
    joinedIds.has(community.community_id)
  ).map((community) => ({
    ...community,
    membership_id: `demo-${community.community_id}`,
    role: "member",
    joined_at: new Date().toISOString(),
  }));
};

export const joinDemoCommunity = (communityId: string) => {
  const ids = new Set(readDemoMembershipIds());
  ids.add(communityId);
  writeDemoMembershipIds(Array.from(ids));
};

export const leaveDemoCommunity = (communityId: string) => {
  writeDemoMembershipIds(
    readDemoMembershipIds().filter((id) => id !== communityId)
  );
};

export const isDemoFallbackError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("not configured") ||
    message.includes("community service") ||
    message.includes("not reachable") ||
    message.includes("request failed") ||
    message.includes("fetch failed") ||
    message.includes("network")
  );
};
