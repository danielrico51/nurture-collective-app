interface ServicesDecorImageProps {
  src: string;
  className?: string;
}

/** Non-interactive decorative SVG from the services icon set. */
const ServicesDecorImage = ({ src, className = "" }: ServicesDecorImageProps) => (
  <img src={src} alt="" aria-hidden className={className} />
);

export default ServicesDecorImage;
