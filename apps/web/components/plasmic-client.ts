"use client";

import { initPlasmicLoader } from "@plasmicapp/loader-react";

const projectId = process.env.NEXT_PUBLIC_PLASMIC_PROJECT_ID ?? "";
const projectToken = process.env.NEXT_PUBLIC_PLASMIC_PROJECT_TOKEN ?? "";

export const PLASMIC_CLIENT = initPlasmicLoader({
  projects: [{ id: projectId, token: projectToken }],
  preview: true,
});
