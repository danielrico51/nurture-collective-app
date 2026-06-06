export interface ReverseGeocodeResult {
  zip: string;
  prefix: string;
  label: string;
}

const normalizeZip = (value: string): string | null => {
  const digits = value.replace(/\D/g, "").slice(0, 5);
  return digits.length === 5 ? digits : null;
};

export const reverseGeocodeZip = async (
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> => {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "NurtureCollective/1.0 (coverage-admin; info@nesting-place.com)",
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    display_name?: string;
    address?: {
      postcode?: string;
      city?: string;
      town?: string;
      county?: string;
      state?: string;
    };
  };

  const postcode = data.address?.postcode;
  if (!postcode) return null;

  const zip = normalizeZip(postcode);
  if (!zip) return null;

  const locality =
    data.address?.city ||
    data.address?.town ||
    data.address?.county ||
    data.address?.state ||
    "Selected area";

  return {
    zip,
    prefix: zip.slice(0, 3),
    label: `${locality} · ZIP ${zip}`,
  };
};
