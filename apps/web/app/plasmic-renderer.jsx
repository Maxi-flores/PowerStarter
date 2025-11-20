"use client";
import { PlasmicComponent } from "@plasmicapp/loader-react";

export default function PlasmicRenderer({ component }) {
  return <PlasmicComponent component={component} />;
}
