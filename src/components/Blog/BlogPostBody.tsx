import { splitBlogBody } from "@/lib/blog/format";

interface BlogPostBodyProps {
  body: string;
  className?: string;
}

export function BlogPostBody({ body, className = "" }: BlogPostBodyProps) {
  const paragraphs = splitBlogBody(body);

  return (
    <div className={`space-y-5 text-base leading-relaxed text-nurture-charcoal/85 ${className}`.trim()}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
