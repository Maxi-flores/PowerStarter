"use client";

import { PlasmicRootProvider } from "@plasmicapp/loader-react";
import { PLASMIC } from "@/components/plasmic-init";

export default function PlasmicRoot({ children }) {
  return (
    <PlasmicRootProvider loader={PLASMIC}>
      {children}
    </PlasmicRootProvider>
  );
}
