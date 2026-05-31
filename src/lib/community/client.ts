"use client";

import {
  fetchCommunities as fetchLiveCommunities,
  fetchMyCommunities as fetchLiveMyCommunities,
  joinCommunity as joinLiveCommunity,
  leaveCommunity as leaveLiveCommunity,
  type CommunityListResponse,
  type MyCommunitiesResponse,
} from "@/lib/api/communityApi";
import { isCommunityDemoFallbackEnabled } from "@/lib/community/config";
import {
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

export const loadCommunityPageData = async (): Promise<CommunityPageData> => {
  try {
    const listing = await fetchLiveCommunities();
    const mine = await fetchLiveMyCommunities();
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
