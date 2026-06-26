export const formatPhoneForDisplay = (e164: string): string => {
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7);
    return `(${area}) ${prefix}-${line}`;
  }
  return e164;
};

/** US-friendly phone text for clipboard (no +1 country prefix). */
export const formatPhoneForCopy = (phone: string): string => {
  const trimmed = phone.trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return formatPhoneForDisplay(`+${digits}`);
  }
  if (digits.length === 10) {
    return formatPhoneForDisplay(`+1${digits}`);
  }

  return trimmed.replace(/^\+1(?=\d)/, "");
};
