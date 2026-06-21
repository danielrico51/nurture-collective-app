export type SlotNumberVariant = "sage" | "lilac";

interface SlotNumberProps {
  target: number;
  prefix?: string;
  suffix?: string;
  variant?: SlotNumberVariant;
}

const SlotNumber = ({
  target,
  prefix = "",
  suffix = "",
  variant = "sage",
}: SlotNumberProps) => {
  const targetStr = String(target);
  const fullLength = prefix.length + targetStr.length + suffix.length;

  return (
    <span
      className={`slot-number slot-number--${variant}`}
      data-target={target}
      style={{ minWidth: `${fullLength + 0.35}ch` }}
    >
      {prefix}
      {targetStr}
      {suffix}
    </span>
  );
};

export default SlotNumber;
