import { PLASMIC } from "@/components/plasmic-init";

export async function fetchPlasmicComponent(path) {
  try {
    const data = await PLASMIC.fetchComponentData(path);
    return data;
  } catch (err) {
    console.error("PLASMIC fetch error:", err);
    return null;
  }
}
