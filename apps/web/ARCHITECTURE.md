# web Architecture

> Auto-generated from [`lib/schemas.ts`](./lib/schemas.ts).
> Run `npm run docs:generate` to refresh after any schema change.
>
> **Last updated:** 2026-04-13

## Table of Contents

1. [Plasmic Project Config](#1-plasmic-project-config) _(3 schemas)_
2. [fetchPlasmicComponent](#2-fetchplasmiccomponent) _(2 schemas)_
3. [PlasmicRoot component props](#3-plasmicroot-component-props) _(1 schema)_
4. [PlasmicRenderer component props](#4-plasmicrenderer-component-props) _(1 schema)_
5. [Dynamic page routing](#5-dynamic-page-routing) _(3 schemas)_
6. [RootLayout props](#6-rootlayout-props) _(1 schema)_
7. [Screen variant (responsive breakpoints)](#7-screen-variant-responsive-breakpoints) _(4 schemas)_
8. [Style tokens](#8-style-tokens) _(3 schemas)_
9. [MenuIcon props](#9-menuicon-props) _(1 schema)_
10. [PlasmicHomepage component schemas](#10-plasmichomepage-component-schemas) _(8 schemas)_
11. [Plasmic CLI / project JSON configs](#11-plasmic-cli-project-json-configs) _(7 schemas)_
12. [Monorepo workspace schema](#12-monorepo-workspace-schema) _(2 schemas)_
13. [Top-level Infrastructure Schema](#13-top-level-infrastructure-schema) _(1 schema)_

---

## 1. Plasmic Project Config

> **Source:** `components/plasmic-init.js, components/plasmic-client.js`

### `PlasmicProjectSchema`

One Plasmic project entry passed to initPlasmicLoader

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `id` | string ≥1 chars | ✅ | — |
| `token` | string ≥1 chars | ✅ | — |

### `PlasmicLoaderConfigSchema`

Full options shape accepted by initPlasmicLoader

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `projects` | [PlasmicProjectSchema](#plasmicprojectschema)[] | ✅ | — |
| `preview` | boolean | ✅ | — |

### `PlasmicLoaderInstancesSchema`

The two concrete loader instances wired in this app

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `PLASMIC` | [PlasmicLoaderConfigSchema](#plasmicloaderconfigschema) | ✅ | Production loader (preview: false) — components/plasmic-init.js |
| `PLASMIC_CLIENT` | [PlasmicLoaderConfigSchema](#plasmicloaderconfigschema) | ✅ | Client/preview loader (preview: true) — components/plasmic-client.js |

---

## 2. fetchPlasmicComponent

> **Source:** `lib/plasmic-server.js`
>
> async function fetchPlasmicComponent(path: string): Promise<data | null>

### `FetchPlasmicComponentInputSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `path` | string ≥1 chars | ✅ | — |

### `FetchPlasmicComponentOutputSchema`

Return type: opaque component-data object or null on error

| Variant |
|---------|
| Record<string, unknown> |
| null |

---

## 3. PlasmicRoot component props

> **Source:** `app/plasmic-root.jsx`
>
> Wraps children in <PlasmicRootProvider loader={PLASMIC}>

### `PlasmicRootPropsSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `children` | `React.ReactNode` | ✅ | — |

---

## 4. PlasmicRenderer component props

> **Source:** `app/plasmic-renderer.jsx`
>
> Renders <PlasmicComponent component={component} />

### `PlasmicRendererPropsSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `component` | string ≥1 chars | ✅ | Name of the Plasmic component to render |

---

## 5. Dynamic page routing

> **Source:** `app/[...slug]/page.tsx`
>
> Maps pathname → Plasmic component name

### `DynamicPagePathnameSchema`

**Type:** string

### `DynamicPageResolvedNameSchema`

Routing resolution: "/" resolves to "Home", any other path strips the leading slash to become the component name.

**Type:** string

### `DynamicPageRoutingSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `pathname` | [DynamicPagePathnameSchema](#dynamicpagepathnameschema) | ✅ | — |
| `resolvedComponentName` | [DynamicPageResolvedNameSchema](#dynamicpageresolvednameschema) | ✅ | — |

---

## 6. RootLayout props

> **Source:** `app/layout.tsx`

### `RootLayoutPropsSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `children` | `React.ReactNode` | ✅ | — |

---

## 7. Screen variant (responsive breakpoints)

> **Source:** `packages/ui/plasmic-components/plasmic/website_starter/PlasmicGlobalVariant__Screen.tsx`

### `ScreenValueSchema`

**Values:** `"mobileOnly"`

### `ScreenBreakpointSchema`

Generic map of screen-value name → media query string

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `mobileOnly` | string | ✅ | — |

### `ScreenBreakpointsSchema`

The concrete breakpoint map used by useScreenVariants

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `mobileOnly` | `"(min-width:0px) and (max-width:768px)"` | ✅ | — |

### `ScreenContextProviderPropsSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `value` | [ScreenValueSchema](#screenvalueschema)[] \| undefined | ✅ | — |
| `children` | `React.ReactNode` | ✅ | — |

---

## 8. Style tokens

> **Source:** `packages/ui/plasmic-components/plasmic/website_starter/PlasmicStyleTokensProvider.tsx`
>
> packages/ui/plasmic-components/plasmic-tokens.theo.json

### `TheoTokenEntrySchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `value` | string \| number | ✅ | — |
| `type` | string? | — | — |
| `comment` | string? | — | — |

### `TheoTokensSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `props` | Record<string, [TheoTokenEntrySchema](#theotokenentryschema)> | ✅ | — |
| `global` | object | ✅ | — |

### `StyleTokensDataSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `base` | string | ✅ | — |
| `varianted` | unknown[] | ✅ | — |

---

## 9. MenuIcon props

> **Source:** `packages/ui/plasmic-components/plasmic/website_starter/icons/PlasmicIcon__Menu.tsx`

### `MenuIconPropsSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `className` | string? | — | — |
| `style` | `React.CSSProperties`? | — | — |
| `title` | string? | — | — |

---

## 10. PlasmicHomepage component schemas

> **Source:** `packages/ui/plasmic-components/plasmic/website_starter/PlasmicHomepage.tsx`

### `PlasmicHomepageNodeNameSchema`

All named nodes in the auto-generated Homepage component

**Values:** `"root"` \| `"powerApps"` \| `"rectangle18"` \| `"svg"` \| `"aiPsPowerApps11"` \| `"rectangle15"` \| `"aiPsSymbol34"` \| `"aiPsPowerapps21"` \| `"rectangle19"` \| `"rectangle20"` \| `"rectangle21"` \| `"aiPsSymbol35"`

### `PlasmicHomepageDescendantsSchema`

Descendant node map: parent → all contained node names

**Shape:** `Record<[PlasmicHomepageNodeNameSchema](#plasmichomepagenodenameschema), [PlasmicHomepageNodeNameSchema](#plasmichomepagenodenameschema)[]>`

### `DefaultHomepagePropsSchema`

External props accepted by the public Homepage component

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `className` | string? | — | — |

### `PlasmicHomepageVariantsArgsSchema`

Variant args (currently empty — no variants defined)

_No fields (empty object)._

### `PlasmicHomepageArgsTypeSchema`

Slot args (currently empty — no slots defined)

_No fields (empty object)._

### `PlasmicHomepageOverridesSchema`

Per-node override shape passed to PlasmicHomepage__RenderFunc

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `root` | unknown? | — | — |
| `powerApps` | unknown? | — | — |
| `rectangle18` | unknown? | — | — |
| `svg` | unknown? | — | — |
| `aiPsPowerApps11` | unknown? | — | — |
| `rectangle15` | unknown? | — | — |
| `aiPsSymbol34` | unknown? | — | — |
| `aiPsPowerapps21` | unknown? | — | — |
| `rectangle19` | unknown? | — | — |
| `rectangle20` | unknown? | — | — |
| `rectangle21` | unknown? | — | — |
| `aiPsSymbol35` | unknown? | — | — |

### `PlasmicHomepageRenderFuncPropsSchema`

Full render-func props for PlasmicHomepage__RenderFunc

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `variants` | [PlasmicHomepageVariantsArgsSchema](#plasmichomepagevariantsargsschema) | ✅ | — |
| `args` | [PlasmicHomepageArgsTypeSchema](#plasmichomepageargstypeschema) | ✅ | — |
| `overrides` | [PlasmicHomepageOverridesSchema](#plasmichomepageoverridesschema) | ✅ | — |
| `forNode` | [PlasmicHomepageNodeNameSchema](#plasmichomepagenodenameschema)? | — | — |

### `PlasmicHomepagePageMetadataSchema`

Page metadata embedded in the exported PlasmicHomepage object

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `title` | string | ✅ | — |
| `description` | string | ✅ | — |
| `ogImageSrc` | string | ✅ | — |
| `canonical` | string | ✅ | — |

---

## 11. Plasmic CLI / project JSON configs

> **Source:** `plasmic.json (root), apps/web/plasmic.json`

### `PlasmicCodeConfigSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `lang` | `ts` \| `js` | ✅ | — |
| `scheme` | `blackbox` \| `direct` | ✅ | — |
| `reactRuntime` | `classic` \| `automatic` | ✅ | — |

### `PlasmicStyleConfigSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `scheme` | `css-modules` \| `css` \| `styled-components` | ✅ | — |
| `defaultStyleCssFilePath` | string | ✅ | — |

### `PlasmicImagesConfigSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `scheme` | `inlined` \| `files` \| `public-files` | ✅ | — |
| `publicDir` | string? | — | — |
| `publicUrlPrefix` | string? | — | — |

### `PlasmicTokensConfigSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `scheme` | `theo` | ✅ | — |
| `tokensFilePath` | string | ✅ | — |

### `PlasmicVariantGroupSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `name` | string | ✅ | — |
| `projectId` | string? | — | — |
| `uuid` | string? | — | — |

### `PlasmicGlobalVariantsConfigSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `variantGroups` | [PlasmicVariantGroupSchema](#plasmicvariantgroupschema)[] | ✅ | — |

### `PlasmicJsonSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `platform` | `react` | ✅ | — |
| `code` | [PlasmicCodeConfigSchema](#plasmiccodeconfigschema) | ✅ | — |
| `style` | [PlasmicStyleConfigSchema](#plasmicstyleconfigschema) | ✅ | — |
| `images` | [PlasmicImagesConfigSchema](#plasmicimagesconfigschema) | ✅ | — |
| `tokens` | [PlasmicTokensConfigSchema](#plasmictokensconfigschema) | ✅ | — |
| `srcDir` | string | ✅ | — |
| `defaultPlasmicDir` | string | ✅ | — |
| `projects` | [PlasmicProjectSchema](#plasmicprojectschema)[] | ✅ | — |
| `globalVariants` | [PlasmicGlobalVariantsConfigSchema](#plasmicglobalvariantsconfigschema) | ✅ | — |
| `wrapPagesWithGlobalContexts` | boolean | ✅ | — |
| `preserveJsImportExtensions` | boolean | ✅ | — |
| `cliVersion` | string | ✅ | — |
| `$schema` | string (url)? | — | — |

---

## 12. Monorepo workspace schema

> **Source:** `pnpm-workspace.yaml, package.json (root)`

### `WorkspacePackageSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `name` | string | ✅ | — |
| `version` | string | ✅ | — |
| `private` | boolean? | — | — |

### `MonorepoWorkspaceSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `name` | string | ✅ | — |
| `version` | string | ✅ | — |
| `private` | boolean | ✅ | — |
| `description` | string | ✅ | — |
| `packages` | string[] | ✅ | — |
| `apps` | [WorkspacePackageSchema](#workspacepackageschema)[] | ✅ | — |
| `uiPackages` | [WorkspacePackageSchema](#workspacepackageschema)[] | ✅ | — |

---

## 13. Top-level Infrastructure Schema
>
> Complete catalog of the PowerStarter monorepo's current surface area

### `InfrastructureSchema`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `workspace` | object | ✅ | Monorepo identity |
| `plasmic` | object | ✅ | Plasmic CMS integration |
| `components` | object | ✅ | React component surface |
| `routing` | Partial<object> | ✅ | Routing |
| `designTokens` | [TheoTokensSchema](#theotokensschema) | ✅ | Design tokens |

