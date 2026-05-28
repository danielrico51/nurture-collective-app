import { splitEventBody } from "@/lib/events/format";

interface EventBodyProps {
  body: string;
  className?: string;
}

export function EventBody({ body, className = "" }: EventBodyProps) {
  const paragraphs = splitEventBody(body);

  return (
    <div className={`space-y-5 text-base leading-relaxed text-nurture-charcoal/85 ${className}`.trim()}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
