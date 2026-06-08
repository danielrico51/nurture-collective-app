import { PUBLIC_MARKETING_ROUTES } from "@/config/seo";
import { getSiteUrl } from "@/config/siteUrl";
import { listPublishedEvents } from "@/lib/events/storage";
import { listPublishedPosts } from "@/lib/blog/storage";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [posts, events] = await Promise.all([
    listPublishedPosts().catch(() => []),
    listPublishedEvents().catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_MARKETING_ROUTES.map(
    (route) => ({
      url: `${siteUrl}${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })
  );

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.date),
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  const eventEntries: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${siteUrl}/events-and-classes/${event.slug}`,
    lastModified: new Date(event.updatedAt || event.eventDate),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries, ...eventEntries];
}
