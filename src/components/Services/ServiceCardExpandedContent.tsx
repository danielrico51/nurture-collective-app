import LeafMark from "@/components/Art/LeafMark";
import { buildCareStartHref } from "@/config/carePaths";
import type { ServiceDetail } from "@/content/serviceDetails";
import type { SourceCitation } from "@/content/sources";
import type { CoreService } from "@/content/site";
import type { RelatedBlogPost } from "@/lib/blog/serviceTags";
import Link from "next/link";

interface ServiceCardExpandedContentProps {
  service: CoreService;
  detail?: ServiceDetail;
  researchPoints?: string[];
  sources?: SourceCitation[];
  relatedPosts?: RelatedBlogPost[];
  showCta?: boolean;
}

const ServiceCardExpandedContent = ({
  service,
  detail,
  researchPoints = [],
  sources = [],
  relatedPosts = [],
  showCta = true,
}: ServiceCardExpandedContentProps) => (
  <div className="text-[13px] leading-relaxed text-nurture-charcoal/75">
    {service.benefit ? (
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-nurture-sage-dark/80">
          Why it helps
        </h3>
        <p className="mt-2 font-medium text-nurture-charcoal/85">{service.benefit}</p>
      </div>
    ) : null}

    {detail?.whatToExpect.length ? (
      <div className={service.benefit ? "mt-4" : ""}>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-nurture-sage-dark/80">
          What to expect
        </h3>
        <ul className="mt-2 space-y-2">
          {detail.whatToExpect.map((item) => (
            <li key={item} className="flex gap-2">
              <span
                aria-hidden
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nurture-sage"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ) : null}

    {researchPoints.length > 0 ? (
      <div className="mt-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-nurture-sage-dark/80">
          Research highlights
        </h3>
        <ul className="mt-2 space-y-2">
          {researchPoints.map((point) => (
            <li key={point} className="flex gap-2">
              <span
                aria-hidden
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nurture-rose"
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    ) : null}

    {relatedPosts.length > 0 ? (
      <div className="mt-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-nurture-sage-dark/80">
          Related reading
        </h3>
        <ul className="mt-2 space-y-2">
          {relatedPosts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="font-semibold text-nurture-sage-dark hover:underline"
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ) : null}

    {sources.length > 0 ? (
      <p className="mt-4 text-[11px] text-nurture-charcoal/55">
        Statistics drawn from published research.{" "}
        <Link href="/sources" className="font-medium text-nurture-sage-dark hover:underline">
          See all sources
        </Link>
      </p>
    ) : null}

    {showCta ? (
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-nurture-sage/10 pt-4">
        <Link
          href={buildCareStartHref(service.slug)}
          className="btn-primary !px-4 !py-2 !text-xs"
        >
          Request support for {service.title.toLowerCase()}
        </Link>
        <LeafMark className="h-4 w-4 opacity-65" />
      </div>
    ) : null}
  </div>
);

export default ServiceCardExpandedContent;
