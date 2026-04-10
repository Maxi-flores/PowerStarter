"use client";

import { PlasmicRootProvider } from "@plasmicapp/loader-react";
import { PLASMIC } from "../components/plasmic-init";
import type { ReactNode } from "react";

interface PlasmicRootProps {
  children: ReactNode;
}

export default function PlasmicRoot({ children }: PlasmicRootProps) {
  return (
    <PlasmicRootProvider loader={PLASMIC}>
      {children}
    </PlasmicRootProvider>
  );
}
