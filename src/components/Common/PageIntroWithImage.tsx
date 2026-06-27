import HeroBlendImage, {
  type HeroBlendVariant,
} from "@/components/Common/HeroBlendImage";
import type { ReactNode } from "react";

interface PageIntroWithImageProps {
  children: ReactNode;
  imageSrc: string;
  imageAlt: string;
  blend?: HeroBlendVariant;
  priority?: boolean;
  className?: string;
}

const PageIntroWithImage = ({
  children,
  imageSrc,
  imageAlt,
  blend = "default",
  priority = false,
  className = "",
}: PageIntroWithImageProps) => (
  <div
    className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-14 ${className}`}
  >
    <div className="relative z-10 text-left">{children}</div>
    <HeroBlendImage
      src={imageSrc}
      alt={imageAlt}
      blend={blend}
      priority={priority}
    />
  </div>
);

export default PageIntroWithImage;
