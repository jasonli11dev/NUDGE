import { Nothing_You_Could_Do, Source_Code_Pro } from "next/font/google";

export const handwritten = Nothing_You_Could_Do({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-handwritten",
});

export const mono = Source_Code_Pro({
  weight: ["200", "300"],
  subsets: ["latin"],
  variable: "--font-mono",
});
