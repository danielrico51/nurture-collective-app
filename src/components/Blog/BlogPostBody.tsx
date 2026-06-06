import { parseBlogBody } from "@/lib/blog/format";

interface BlogPostBodyProps {
  body: string;
  className?: string;
}

export function BlogPostBody({ body, className = "" }: BlogPostBodyProps) {
  const blocks = parseBlogBody(body);

  return (
    <div className={`space-y-5 text-base leading-relaxed text-nurture-charcoal/85 ${className}`.trim()}>
      {blocks.map((block, index) =>
        block.type === "heading" ? (
          <h2
            key={index}
            className="pt-2 font-serif text-xl font-semibold text-nurture-charcoal"
          >
            {block.text}
          </h2>
        ) : (
          <p key={index}>{block.text}</p>
        )
      )}
    </div>
  );
}
