import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PlasmicRoot from "./plasmic-root";
import { SITE_URL } from "@/lib/constants";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PowerStarter | TheRocketTree",
    template: "%s | TheRocketTree",
  },
  description:
    "PowerStarter – a digital portfolio platform by TheRocketTree, showcasing Powerframe BMS calculations and interactive Unity experiences.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    siteName: "PowerStarter",
    title: "PowerStarter | TheRocketTree",
    description:
      "Digital portfolio platform for Powerframe BMS and Unity game interfaces.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PowerStarter | TheRocketTree",
    description:
      "Digital portfolio platform for Powerframe BMS and Unity game interfaces.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <PlasmicRoot>{children}</PlasmicRoot>
      </body>
    </html>
  );
}
