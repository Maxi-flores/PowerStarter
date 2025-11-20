import PlasmicRoot from "./plasmic-root";

import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {

  return (
    <html lang="en">
      <body>
        <PlasmicRoot>
          {children}
        </PlasmicRoot>
      </body>
    </html>
  );
}
