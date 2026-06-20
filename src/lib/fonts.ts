import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const fontVariables = `${instrumentSerif.variable} ${plusJakartaSans.variable}`;
