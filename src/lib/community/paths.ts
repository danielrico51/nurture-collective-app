export const communityListPath = "/apps/community";

export const communityDetailPath = (communityId: string): string =>
  `${communityListPath}/${encodeURIComponent(communityId)}`;

export const communityPostPath = (
  communityId: string,
  postId: string
): string =>
  `${communityDetailPath(communityId)}/posts/${encodeURIComponent(postId)}`;
