import Image from "next/image";

const BABY_ASLEEP_SRC = "/branding/baby-asleep.png";
const BABY_AWAKE_SRC = "/branding/baby-awake.png";

const SIZE_CLASS = {
  footer: "logo-icon-wrapper--footer",
  header: "logo-icon-wrapper--header",
  compact: "logo-icon-wrapper--compact",
} as const;

const IMAGE_SIZES = {
  footer: "(min-width: 768px) 15rem, (min-width: 640px) 13rem, 10.5rem",
  header: "(min-width: 768px) 5.94rem, (min-width: 640px) 5.4rem, 4.125rem",
  compact: "(min-width: 768px) 4.125rem, (min-width: 640px) 3.75rem, 3.375rem",
} as const;

export type BrandBabyMarkSize = keyof typeof SIZE_CLASS;

interface BrandBabyMarkProps {
  size?: BrandBabyMarkSize;
  priority?: boolean;
}

const BrandBabyMark = ({ size = "footer", priority = false }: BrandBabyMarkProps) => (
  <span className={`logo-icon-wrapper ${SIZE_CLASS[size]}`}>
    <Image
      src={BABY_AWAKE_SRC}
      alt=""
      aria-hidden
      fill
      quality={92}
      priority={priority}
      sizes={IMAGE_SIZES[size]}
      className="brand-baby-layer brand-baby-awake"
    />
    <Image
      src={BABY_ASLEEP_SRC}
      alt=""
      aria-hidden
      fill
      quality={92}
      priority={priority}
      sizes={IMAGE_SIZES[size]}
      className="brand-baby-layer brand-baby-sleeping"
    />
  </span>
);

export default BrandBabyMark;
