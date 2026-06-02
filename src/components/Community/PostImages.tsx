import { resolvePostImageUrl } from "@/lib/community/postImageClient";

interface PostImagesProps {
  urls: string[];
  compact?: boolean;
}

export function PostImages({ urls, compact = false }: PostImagesProps) {
  const resolved = urls.map(resolvePostImageUrl).filter(Boolean);
  if (!resolved.length) return null;

  const maxHeightClass = compact ? "max-h-56" : "max-h-[28rem]";

  if (resolved.length === 1) {
    return (
      <div className="mt-3 overflow-hidden rounded-xl bg-nurture-cream/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolved[0]}
          alt=""
          className={`mx-auto w-full ${maxHeightClass} object-contain`}
          loading="lazy"
        />
      </div>
    );
  }

  const gridClass =
    resolved.length === 2
      ? "grid-cols-2"
      : "grid-cols-2 sm:grid-cols-3";

  const cellMaxHeight = compact ? "max-h-40" : "max-h-56";

  return (
    <div className={`mt-3 grid gap-1.5 ${gridClass}`}>
      {resolved.map((url) => (
        <div
          key={url}
          className="flex min-h-[8rem] items-center justify-center overflow-hidden rounded-xl bg-nurture-cream/60"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className={`max-w-full ${cellMaxHeight} object-contain`}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
