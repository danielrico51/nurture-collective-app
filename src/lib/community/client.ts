"use client";

import {
  createCommunity as createLiveCommunity,
  fetchCommunities as fetchLiveCommunities,
  fetchCommunityDetail as fetchLiveCommunityDetail,
  fetchMyCommunities as fetchLiveMyCommunities,
  joinCommunity as joinLiveCommunity,
  leaveCommunity as leaveLiveCommunity,
  type CommunityDetail,
  type CommunityListResponse,
  type CommunitySummary,
  type CreateCommunityInput,
  type MyCommunitiesResponse,
} from "@/lib/api/communityApi";
import { runWithAutoRetry } from "@/lib/api/fetchWithRetry";
import { isCommunityDemoFallbackEnabled } from "@/lib/community/config";
import {
  createDemoCommunity,
  getDemoCommunityDetail,
  getDemoListResponse,
  getDemoMyCommunities,
  isDemoFallbackError,
  joinDemoCommunity,
  leaveDemoCommunity,
} from "@/lib/community/demoData";

let demoModeActive = false;

export const isCommunityDemoMode = (): boolean => demoModeActive;

export interface CommunityPageData {
  listing: CommunityListResponse;
  mine: MyCommunitiesResponse;
  demoMode: boolean;
}

export interface CommunityDetailPageData {
  detail: CommunityDetail;
  demoMode: boolean;
}

export const loadCommunityDetail = async (
  communityId: string
): Promise<CommunityDetailPageData> => {
  try {
    const detail = await runWithAutoRetry(() =>
      fetchLiveCommunityDetail(communityId)
    );
    demoModeActive = false;
    return { detail, demoMode: false };
  } catch (error) {
    if (!isCommunityDemoFallbackEnabled() || !isDemoFallbackError(error)) {
      throw error;
    }
    demoModeActive = true;
    const detail = getDemoCommunityDetail(communityId);
    if (!detail) {
      throw new Error("Community not found");
    }
    return { detail, demoMode: true };
  }
};

export const loadCommunityPageData = async (): Promise<CommunityPageData> => {
  try {
    const { listing, mine } = await runWithAutoRetry(() =>
      Promise.all([fetchLiveCommunities(), fetchLiveMyCommunities()]).then(
        ([listing, mine]) => ({ listing, mine })
      )
    );
    demoModeActive = false;
    return { listing, mine, demoMode: false };
  } catch (error) {
    if (!isCommunityDemoFallbackEnabled() || !isDemoFallbackError(error)) {
      throw error;
    }
    demoModeActive = true;
    return {
      listing: getDemoListResponse(),
      mine: { results: getDemoMyCommunities() },
      demoMode: true,
    };
  }
};

export const createCommunityWithFallback = async (
  input: CreateCommunityInput
): Promise<{ community: CommunitySummary; demoMode: boolean }> => {
  if (demoModeActive) {
    return { community: createDemoCommunity(input), demoMode: true };
  }

  try {
    const community = await createLiveCommunity(input);
    return { community, demoMode: false };
  } catch (error) {
    if (!isCommunityDemoFallbackEnabled() || !isDemoFallbackError(error)) {
      throw error;
    }
    demoModeActive = true;
    return { community: createDemoCommunity(input), demoMode: true };
  }
};

export const joinCommunityWithFallback = async (communityId: string) => {
  if (demoModeActive) {
    joinDemoCommunity(communityId);
    return;
  }

  try {
    await joinLiveCommunity(communityId);
  } catch (error) {
    if (!isCommunityDemoFallbackEnabled() || !isDemoFallbackError(error)) {
      throw error;
    }
    demoModeActive = true;
    joinDemoCommunity(communityId);
  }
};

export const leaveCommunityWithFallback = async (communityId: string) => {
  if (demoModeActive) {
    leaveDemoCommunity(communityId);
    return;
  }

  try {
    await leaveLiveCommunity(communityId);
  } catch (error) {
    if (!isCommunityDemoFallbackEnabled() || !isDemoFallbackError(error)) {
      throw error;
    }
    demoModeActive = true;
    leaveDemoCommunity(communityId);
  }
};
