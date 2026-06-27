import { getServiceDetail } from "@/content/serviceDetails";
import { featuredServiceStats, statPointToString } from "@/content/serviceStats";
import { sourceCitations } from "@/content/sources";
import type { ServiceSlug } from "@/content/site";
import {
  getRelatedBlogPostsForService,
  type RelatedBlogPost,
} from "@/lib/blog/serviceTags";
import type { BlogPost } from "@/types/blog";
import type { SourceCitation } from "@/content/sources";
import type { ServiceDetail } from "@/content/serviceDetails";

export interface ServiceCardData {
  detail?: ServiceDetail;
  researchPoints: string[];
  sources: SourceCitation[];
  relatedPosts: RelatedBlogPost[];
}

const sourcesByUrl = Object.fromEntries(
  sourceCitations.map((citation) => [citation.url, citation])
) as Record<string, SourceCitation>;

export const buildServiceCardData = (
  slug: ServiceSlug,
  blogPosts: BlogPost[]
): ServiceCardData => {
  const detail = getServiceDetail(slug);
  const stats = featuredServiceStats.find((entry) => entry.slug === slug);
  const sources = (detail?.sourceUrls ?? [])
    .map((url) => sourcesByUrl[url])
    .filter((citation): citation is SourceCitation => Boolean(citation));

  return {
    detail,
    researchPoints: stats?.points.map(statPointToString) ?? [],
    sources,
    relatedPosts: getRelatedBlogPostsForService(blogPosts, slug),
  };
};
