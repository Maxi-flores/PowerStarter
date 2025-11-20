"use client";

import { usePathname } from "next/navigation";
import { PlasmicComponent } from "@plasmicapp/loader-react";
import { PLASMIC } from "../../components/plasmic-init";

export default function Page() {
  const pathname = usePathname();

  const componentName = pathname === "/" ? "Home" : pathname.replace("/", "");

  return (
    <PlasmicComponent
      component={componentName}
    />
  );
}
