"use client";

import { PlasmicComponent } from "@plasmicapp/loader-react";

interface PlasmicRendererProps {
  component: string;
}

export default function PlasmicRenderer({ component }: PlasmicRendererProps) {
  return <PlasmicComponent component={component} />;
}
