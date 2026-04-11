import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "BMS Command Center",
  description: "Real-time BMS lifecycle feed — RootPlanner Command Center",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
