import { PlasmicComponent } from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "../../components/plasmic-init";

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = await params;
  const path = resolvedParams?.slug?.join("/") || "home";

  const plasmicData = await PLASMIC.fetchComponentDataAsync(path);

  if (!plasmicData) {
    return <div>Plasmic page not found: {path}</div>;
  }

  const compName = plasmicData.entryCompMetas[0]?.name;

  return (
    <PlasmicComponent
      component={compName}
      componentProps={{
        path: "/" + (resolvedParams?.slug?.join("/") || ""),
      }}
    />
  );
}
