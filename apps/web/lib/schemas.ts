/**
 * Infrastructure Zod Schemas — PowerStarter Monorepo
 *
 * Catalogs every function, component, config object, and routing shape
 * in the current codebase so the architecture can be validated and
 * merged into the broader monorepo contract.
 *
 * Source files indexed:
 *   apps/web/components/plasmic-init.js
 *   apps/web/lib/plasmic-server.js
 *   apps/web/app/plasmic-root.jsx
 *   apps/web/app/plasmic-renderer.jsx
 *   apps/web/app/layout.tsx
 *   apps/web/app/page.tsx
 *   apps/web/app/[...slug]/page.tsx
 *   packages/ui/plasmic-components/Homepage.tsx
 *   packages/ui/plasmic-components/plasmic/website_starter/PlasmicHomepage.tsx
 *   packages/ui/plasmic-components/plasmic/website_starter/PlasmicGlobalVariant__Screen.tsx
 *   packages/ui/plasmic-components/plasmic/website_starter/PlasmicStyleTokensProvider.tsx
 *   packages/ui/plasmic-components/plasmic/website_starter/icons/PlasmicIcon__Menu.tsx
 *   plasmic.json (root)
 *   apps/web/plasmic.json
 *   pnpm-workspace.yaml
 */

import type React from "react";
import { z } from "zod";

// ---------------------------------------------------------------------------
// 1. Plasmic Project Config
//    Source: components/plasmic-init.js, components/plasmic-client.js
// ---------------------------------------------------------------------------

/** One Plasmic project entry passed to initPlasmicLoader */
export const PlasmicProjectSchema = z.object({
  id: z.string().min(1),
  token: z.string().min(1),
});
export type PlasmicProject = z.infer<typeof PlasmicProjectSchema>;

/** Full options shape accepted by initPlasmicLoader */
export const PlasmicLoaderConfigSchema = z.object({
  projects: z.array(PlasmicProjectSchema).min(1),
  preview: z.boolean(),
});
export type PlasmicLoaderConfig = z.infer<typeof PlasmicLoaderConfigSchema>;

/** The two concrete loader instances wired in this app */
export const PlasmicLoaderInstancesSchema = z.object({
  /** Production loader (preview: false) — components/plasmic-init.js */
  PLASMIC: PlasmicLoaderConfigSchema,
  /** Client/preview loader (preview: true) — components/plasmic-client.js */
  PLASMIC_CLIENT: PlasmicLoaderConfigSchema,
});
export type PlasmicLoaderInstances = z.infer<typeof PlasmicLoaderInstancesSchema>;

// ---------------------------------------------------------------------------
// 2. fetchPlasmicComponent
//    Source: lib/plasmic-server.js
//    async function fetchPlasmicComponent(path: string): Promise<data | null>
// ---------------------------------------------------------------------------

export const FetchPlasmicComponentInputSchema = z.object({
  path: z.string().min(1),
});
export type FetchPlasmicComponentInput = z.infer<typeof FetchPlasmicComponentInputSchema>;

/** Return type: opaque component-data object or null on error */
export const FetchPlasmicComponentOutputSchema = z.union([
  z.record(z.string(), z.unknown()),
  z.null(),
]);
export type FetchPlasmicComponentOutput = z.infer<typeof FetchPlasmicComponentOutputSchema>;

// ---------------------------------------------------------------------------
// 3. PlasmicRoot component props
//    Source: app/plasmic-root.jsx
//    Wraps children in <PlasmicRootProvider loader={PLASMIC}>
// ---------------------------------------------------------------------------

export const PlasmicRootPropsSchema = z.object({
  children: z.custom<React.ReactNode>(),
});
export type PlasmicRootProps = z.infer<typeof PlasmicRootPropsSchema>;

// ---------------------------------------------------------------------------
// 4. PlasmicRenderer component props
//    Source: app/plasmic-renderer.jsx
//    Renders <PlasmicComponent component={component} />
// ---------------------------------------------------------------------------

export const PlasmicRendererPropsSchema = z.object({
  /** Name of the Plasmic component to render */
  component: z.string().min(1),
});
export type PlasmicRendererProps = z.infer<typeof PlasmicRendererPropsSchema>;

// ---------------------------------------------------------------------------
// 5. Dynamic page routing
//    Source: app/[...slug]/page.tsx
//    Maps pathname → Plasmic component name
// ---------------------------------------------------------------------------

export const DynamicPagePathnameSchema = z.string().min(1);

/**
 * Routing resolution: "/" resolves to "Home", any other path strips the
 * leading slash to become the component name.
 */
export const DynamicPageResolvedNameSchema = z.string().min(1);

export const DynamicPageRoutingSchema = z.object({
  pathname: DynamicPagePathnameSchema,
  resolvedComponentName: DynamicPageResolvedNameSchema,
});
export type DynamicPageRouting = z.infer<typeof DynamicPageRoutingSchema>;

// ---------------------------------------------------------------------------
// 6. RootLayout props
//    Source: app/layout.tsx
// ---------------------------------------------------------------------------

export const RootLayoutPropsSchema = z.object({
  children: z.custom<React.ReactNode>(),
});
export type RootLayoutProps = z.infer<typeof RootLayoutPropsSchema>;

// ---------------------------------------------------------------------------
// 7. Screen variant (responsive breakpoints)
//    Source: packages/ui/plasmic-components/plasmic/website_starter/PlasmicGlobalVariant__Screen.tsx
// ---------------------------------------------------------------------------

export const ScreenValueSchema = z.enum(["mobileOnly"]);
export type ScreenValue = z.infer<typeof ScreenValueSchema>;

/** Generic map of screen-value name → media query string */
export const ScreenBreakpointSchema = z.object({
  mobileOnly: z.string(),
});
export type ScreenBreakpoint = z.infer<typeof ScreenBreakpointSchema>;

/** The concrete breakpoint map used by useScreenVariants */
export const ScreenBreakpointsSchema = z.object({
  mobileOnly: z.literal("(min-width:0px) and (max-width:768px)"),
});
export type ScreenBreakpoints = z.infer<typeof ScreenBreakpointsSchema>;

export const ScreenContextProviderPropsSchema = z.object({
  value: z.union([z.array(ScreenValueSchema), z.undefined()]),
  children: z.custom<React.ReactNode>(),
});
export type ScreenContextProviderProps = z.infer<typeof ScreenContextProviderPropsSchema>;

// ---------------------------------------------------------------------------
// 8. Style tokens
//    Source: packages/ui/plasmic-components/plasmic/website_starter/PlasmicStyleTokensProvider.tsx
//    packages/ui/plasmic-components/plasmic-tokens.theo.json
// ---------------------------------------------------------------------------

export const TheoTokenEntrySchema = z.object({
  value: z.union([z.string(), z.number()]),
  type: z.string().optional(),
  comment: z.string().optional(),
});
export type TheoTokenEntry = z.infer<typeof TheoTokenEntrySchema>;

export const TheoTokensSchema = z.object({
  props: z.record(z.string(), TheoTokenEntrySchema),
  global: z.object({
    meta: z.object({
      source: z.string(),
    }),
  }),
});
export type TheoTokens = z.infer<typeof TheoTokensSchema>;

export const StyleTokensDataSchema = z.object({
  base: z.string(),
  varianted: z.array(z.unknown()),
});
export type StyleTokensData = z.infer<typeof StyleTokensDataSchema>;

// ---------------------------------------------------------------------------
// 9. MenuIcon props
//    Source: packages/ui/plasmic-components/plasmic/website_starter/icons/PlasmicIcon__Menu.tsx
// ---------------------------------------------------------------------------

export const MenuIconPropsSchema = z.object({
  className: z.string().optional(),
  style: z.custom<React.CSSProperties>().optional(),
  title: z.string().optional(),
});
export type MenuIconProps = z.infer<typeof MenuIconPropsSchema>;

// ---------------------------------------------------------------------------
// 10. PlasmicHomepage component schemas
//     Source: packages/ui/plasmic-components/plasmic/website_starter/PlasmicHomepage.tsx
// ---------------------------------------------------------------------------

/** All named nodes in the auto-generated Homepage component */
export const PlasmicHomepageNodeNameSchema = z.enum([
  "root",
  "powerApps",
  "rectangle18",
  "svg",
  "aiPsPowerApps11",
  "rectangle15",
  "aiPsSymbol34",
  "aiPsPowerapps21",
  "rectangle19",
  "rectangle20",
  "rectangle21",
  "aiPsSymbol35",
]);
export type PlasmicHomepageNodeName = z.infer<typeof PlasmicHomepageNodeNameSchema>;

/** Descendant node map: parent → all contained node names */
export const PlasmicHomepageDescendantsSchema = z.record(
  PlasmicHomepageNodeNameSchema,
  z.array(PlasmicHomepageNodeNameSchema)
);
export type PlasmicHomepageDescendants = z.infer<typeof PlasmicHomepageDescendantsSchema>;

/** External props accepted by the public Homepage component */
export const DefaultHomepagePropsSchema = z.object({
  className: z.string().optional(),
});
export type DefaultHomepageProps = z.infer<typeof DefaultHomepagePropsSchema>;

/** Variant args (currently empty — no variants defined) */
export const PlasmicHomepageVariantsArgsSchema = z.object({});
export type PlasmicHomepageVariantsArgs = z.infer<typeof PlasmicHomepageVariantsArgsSchema>;

/** Slot args (currently empty — no slots defined) */
export const PlasmicHomepageArgsTypeSchema = z.object({});
export type PlasmicHomepageArgsType = z.infer<typeof PlasmicHomepageArgsTypeSchema>;

/** Per-node override shape passed to PlasmicHomepage__RenderFunc */
export const PlasmicHomepageOverridesSchema = z.object({
  root: z.unknown().optional(),
  powerApps: z.unknown().optional(),
  rectangle18: z.unknown().optional(),
  svg: z.unknown().optional(),
  aiPsPowerApps11: z.unknown().optional(),
  rectangle15: z.unknown().optional(),
  aiPsSymbol34: z.unknown().optional(),
  aiPsPowerapps21: z.unknown().optional(),
  rectangle19: z.unknown().optional(),
  rectangle20: z.unknown().optional(),
  rectangle21: z.unknown().optional(),
  aiPsSymbol35: z.unknown().optional(),
});
export type PlasmicHomepageOverrides = z.infer<typeof PlasmicHomepageOverridesSchema>;

/** Full render-func props for PlasmicHomepage__RenderFunc */
export const PlasmicHomepageRenderFuncPropsSchema = z.object({
  variants: PlasmicHomepageVariantsArgsSchema,
  args: PlasmicHomepageArgsTypeSchema,
  overrides: PlasmicHomepageOverridesSchema,
  forNode: PlasmicHomepageNodeNameSchema.optional(),
});
export type PlasmicHomepageRenderFuncProps = z.infer<typeof PlasmicHomepageRenderFuncPropsSchema>;

/** Page metadata embedded in the exported PlasmicHomepage object */
export const PlasmicHomepagePageMetadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  ogImageSrc: z.string(),
  canonical: z.string(),
});
export type PlasmicHomepagePageMetadata = z.infer<typeof PlasmicHomepagePageMetadataSchema>;

// ---------------------------------------------------------------------------
// 11. Plasmic CLI / project JSON configs
//     Source: plasmic.json (root), apps/web/plasmic.json
// ---------------------------------------------------------------------------

export const PlasmicCodeConfigSchema = z.object({
  lang: z.enum(["ts", "js"]),
  scheme: z.enum(["blackbox", "direct"]),
  reactRuntime: z.enum(["classic", "automatic"]),
});

export const PlasmicStyleConfigSchema = z.object({
  scheme: z.enum(["css-modules", "css", "styled-components"]),
  defaultStyleCssFilePath: z.string(),
});

export const PlasmicImagesConfigSchema = z.object({
  scheme: z.enum(["inlined", "files", "public-files"]),
  publicDir: z.string().optional(),
  publicUrlPrefix: z.string().optional(),
});

export const PlasmicTokensConfigSchema = z.object({
  scheme: z.enum(["theo"]),
  tokensFilePath: z.string(),
});

export const PlasmicVariantGroupSchema = z.object({
  name: z.string(),
  projectId: z.string().optional(),
  uuid: z.string().optional(),
});
export type PlasmicVariantGroup = z.infer<typeof PlasmicVariantGroupSchema>;

export const PlasmicGlobalVariantsConfigSchema = z.object({
  variantGroups: z.array(PlasmicVariantGroupSchema),
});

export const PlasmicJsonSchema = z.object({
  platform: z.enum(["react"]),
  code: PlasmicCodeConfigSchema,
  style: PlasmicStyleConfigSchema,
  images: PlasmicImagesConfigSchema,
  tokens: PlasmicTokensConfigSchema,
  srcDir: z.string(),
  defaultPlasmicDir: z.string(),
  projects: z.array(PlasmicProjectSchema),
  globalVariants: PlasmicGlobalVariantsConfigSchema,
  wrapPagesWithGlobalContexts: z.boolean(),
  preserveJsImportExtensions: z.boolean(),
  cliVersion: z.string(),
  $schema: z.string().url().optional(),
});
export type PlasmicJson = z.infer<typeof PlasmicJsonSchema>;

// ---------------------------------------------------------------------------
// 12. Monorepo workspace schema
//     Source: pnpm-workspace.yaml, package.json (root)
// ---------------------------------------------------------------------------

export const WorkspacePackageSchema = z.object({
  name: z.string(),
  version: z.string(),
  private: z.boolean().optional(),
});
export type WorkspacePackage = z.infer<typeof WorkspacePackageSchema>;

export const MonorepoWorkspaceSchema = z.object({
  name: z.string(),
  version: z.string(),
  private: z.boolean(),
  description: z.string(),
  packages: z.array(z.string()),
  apps: z.array(WorkspacePackageSchema),
  uiPackages: z.array(WorkspacePackageSchema),
});
export type MonorepoWorkspace = z.infer<typeof MonorepoWorkspaceSchema>;

// ---------------------------------------------------------------------------
// 13. Top-level Infrastructure Schema
//     Complete catalog of the PowerStarter monorepo's current surface area
// ---------------------------------------------------------------------------

export const InfrastructureSchema = z.object({
  /** Monorepo identity */
  workspace: z.object({
    name: z.literal("powerstarter"),
    version: z.string(),
    apps: z.array(z.string()),
    packages: z.array(z.string()),
  }),

  /** Plasmic CMS integration */
  plasmic: z.object({
    loaders: PlasmicLoaderInstancesSchema,
    config: PlasmicJsonSchema,
    functions: z.object({
      fetchPlasmicComponent: z.object({
        input: FetchPlasmicComponentInputSchema,
        output: FetchPlasmicComponentOutputSchema,
      }),
    }),
  }),

  /** React component surface */
  components: z.object({
    PlasmicRoot: z.object({ props: PlasmicRootPropsSchema }),
    PlasmicRenderer: z.object({ props: PlasmicRendererPropsSchema }),
    RootLayout: z.object({ props: RootLayoutPropsSchema }),
    PlasmicHomepage: z.object({
      defaultProps: DefaultHomepagePropsSchema,
      variantsArgs: PlasmicHomepageVariantsArgsSchema,
      argsType: PlasmicHomepageArgsTypeSchema,
      overrides: PlasmicHomepageOverridesSchema,
      pageMetadata: PlasmicHomepagePageMetadataSchema,
      nodeNames: z.array(PlasmicHomepageNodeNameSchema),
    }),
    MenuIcon: z.object({ props: MenuIconPropsSchema }),
    ScreenContextProvider: z.object({ props: ScreenContextProviderPropsSchema }),
    StyleTokensProvider: z.object({ data: StyleTokensDataSchema }),
  }),

  /** Routing */
  routing: z.object({
    dynamic: DynamicPageRoutingSchema.partial(),
    screenBreakpoints: ScreenBreakpointsSchema,
  }),

  /** Design tokens */
  designTokens: TheoTokensSchema,
});

export type Infrastructure = z.infer<typeof InfrastructureSchema>;
