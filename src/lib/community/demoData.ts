import type {
  CommunityDetail,
  CommunityListResponse,
  CommunityMembershipDetail,
  CommunitySummary,
  MyCommunity,
} from "@/lib/api/communityApi";
import type {
  CommunityPost,
  PostComment,
} from "@/lib/api/communityDiscussionApi";
import { withDefaultReactions } from "@/lib/api/communityDiscussionApi";

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
export const DEMO_CREATED_STORAGE_KEY = "nurture-community-demo-created";

export const readDemoCreatedCommunities = (): CommunitySummary[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_CREATED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CommunitySummary[]) : [];
  } catch {
    return [];
  }
};

const writeDemoCreatedCommunities = (communities: CommunitySummary[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    DEMO_CREATED_STORAGE_KEY,
    JSON.stringify(communities)
  );
};

const allDemoCommunities = (): CommunitySummary[] => [
  ...readDemoCreatedCommunities(),
  ...DEMO_COMMUNITIES,
];

export const createDemoCommunity = (input: {
  name: string;
  description?: string;
  visibility?: string;
  tags?: string[];
}): CommunitySummary => {
  const community: CommunitySummary = {
    community_id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `demo-${crypto.randomUUID()}`
        : `demo-${Date.now()}`,
    organization_id: DEMO_ORG_ID,
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    visibility: input.visibility ?? "public",
    tags: input.tags ?? [],
    member_count: 1,
  };

  writeDemoCreatedCommunities([community, ...readDemoCreatedCommunities()]);
  // Creator auto-joins their own community.
  joinDemoCommunity(community.community_id);
  return community;
};

export const getDemoListResponse = (): CommunityListResponse => {
  const all = allDemoCommunities();
  return {
    count: all.length,
    next: null,
    previous: null,
    results: all,
  };
};

export const getDemoCommunityById = (communityId: string): CommunitySummary | undefined =>
  allDemoCommunities().find(
    (community) => community.community_id === communityId
  );

export const getDemoCommunityDetail = (
  communityId: string
): CommunityDetail | null => {
  const community = getDemoCommunityById(communityId);
  if (!community) return null;

  const joined = readDemoMembershipIds().includes(communityId);
  const membership: CommunityMembershipDetail | null = joined
    ? {
        membership_id: `demo-${communityId}`,
        community_id: communityId,
        user_id: "demo-user",
        organization_id: community.organization_id,
        role: "member",
        joined_at: new Date().toISOString(),
      }
    : null;

  return {
    ...community,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    my_membership: membership,
  };
};

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
  const createdIds = new Set(
    readDemoCreatedCommunities().map((c) => c.community_id)
  );
  return allDemoCommunities()
    .filter((community) => joinedIds.has(community.community_id))
    .map((community) => ({
      ...community,
      membership_id: `demo-${community.community_id}`,
      role: createdIds.has(community.community_id) ? "owner" : "member",
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

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3600 * 1000).toISOString();

const DEMO_POSTS_BY_COMMUNITY: Record<string, CommunityPost[]> = {
  "10000000-0000-4000-8000-000000000001": [
    {
      post_id: "demo-post-pp-1",
      community_id: "10000000-0000-4000-8000-000000000001",
      author_id: "demo-author-1",
      author_name: "Jordan M.",
      title: "Fourth trimester check-in",
      body: "Week 3 postpartum and feeling overwhelmed at night. Anyone else struggling with the 2am wake-ups? Would love to hear what helped you.",
      comment_count: 2,
      reactions: {
        total: 5,
        counts: { like: 3, love: 2 },
        user_reaction: null,
      },
      created_at: hoursAgo(5),
    },
    {
      post_id: "demo-post-pp-2",
      community_id: "10000000-0000-4000-8000-000000000001",
      author_id: "demo-author-2",
      author_name: "Sam K.",
      title: "",
      body: "Pediatrician recommended cluster feeding before bed — game changer for us. Happy to share our rough schedule if useful.",
      comment_count: 0,
      reactions: { total: 1, counts: { care: 1 }, user_reaction: null },
      created_at: hoursAgo(28),
    },
  ],
  "10000000-0000-4000-8000-000000000002": [
    {
      post_id: "demo-post-ftm-1",
      community_id: "10000000-0000-4000-8000-000000000002",
      author_id: "demo-author-3",
      author_name: "Alex R.",
      title: "Hospital bag — what did you actually use?",
      body: "Packing for delivery next month. What items did you reach for vs. what stayed in the bag?",
      comment_count: 1,
      reactions: { total: 2, counts: { like: 1, love: 1 }, user_reaction: null },
      created_at: hoursAgo(12),
    },
  ],
};

const DEMO_COMMENTS_BY_POST: Record<string, PostComment[]> = {
  "demo-post-pp-1": [
    {
      comment_id: "demo-comment-pp-1a",
      post_id: "demo-post-pp-1",
      parent_id: null,
      author_id: "demo-author-4",
      author_name: "Riley T.",
      body: "Tag-teaming with my partner for one night shift block helped a lot.",
      created_at: hoursAgo(4),
      replies: [
        {
          comment_id: "demo-comment-pp-1b",
          post_id: "demo-post-pp-1",
          parent_id: "demo-comment-pp-1a",
          author_id: "demo-author-1",
          author_name: "Jordan M.",
          body: "Thank you — we'll try that this week.",
          created_at: hoursAgo(3),
        },
      ],
    },
    {
      comment_id: "demo-comment-pp-1c",
      post_id: "demo-post-pp-1",
      parent_id: null,
      author_id: "demo-author-5",
      author_name: "Casey L.",
      body: "You're not alone. The nights do get easier.",
      created_at: hoursAgo(2),
      replies: [],
    },
  ],
  "demo-post-ftm-1": [
    {
      comment_id: "demo-comment-ftm-1a",
      post_id: "demo-post-ftm-1",
      parent_id: null,
      author_id: "demo-author-6",
      author_name: "Morgan P.",
      body: "Slippers and phone charger were daily essentials. Fancy outfit for baby — barely used.",
      created_at: hoursAgo(10),
      replies: [],
    },
  ],
};

export const getDemoPostsForCommunity = (communityId: string): CommunityPost[] =>
  (DEMO_POSTS_BY_COMMUNITY[communityId] ?? []).map(withDefaultReactions);

export const getDemoPostById = (
  communityId: string,
  postId: string
): CommunityPost | null => {
  const posts = getDemoPostsForCommunity(communityId);
  return posts.find((p) => p.post_id === postId) ?? null;
};

export const getDemoPostComments = (
  _communityId: string,
  postId: string
): PostComment[] => DEMO_COMMENTS_BY_POST[postId] ?? [];

export const isDemoFallbackError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("not configured") ||
    message.includes("community service") ||
    message.includes("not reachable") ||
    message.includes("fetch failed") ||
    message.includes("network")
  );
};
