# AGENTS.md – vempain-rt-renderer

Reusable React component library (published as `@vempain/vempain-rt-renderer` to GitHub Packages) that parses and renders Vempain rich-text page bodies
containing `<!--vps:embed:…-->` tags.

- Public usage docs are mirrored in `vempain-site` (`src/components/RtRenderer.tsx`) and the host-integration guide is `AGENTS.integration.md`; keep
  `RendererProvider`, `PageBodyRenderer`, and the exported embed component props in sync with both.

---

## Architecture overview

```
src/
  types.ts                  – All shared TypeScript interfaces (ApiResponse, PageEmbed, Gps*, Music*, etc.)
  index.ts                  – Single public entry point; everything exported here is the library API
  runtime/RendererProvider  – React context that injects host APIs into every embed component
  tools/parseEmbeds.ts      – Stateless parser: HTML string → PageEmbed[]
  components/               – One file per embed type; each calls useRendererRuntime()
```

**Data flow**: `PageBodyRenderer` receives an HTML `body` string → calls `parseEmbeds` to extract embed descriptors → walks the string to splice HTML fragments
and React embed components into a `segments[]` array → renders with `dangerouslySetInnerHTML` for raw HTML fragments.

---

## RendererProvider (required host wiring)

Every embed component calls `useRendererRuntime()`. Wrapping the consumer app in `<RendererProvider>` is **mandatory**; omitting it throws at runtime.

```tsx
<RendererProvider value={{pageAPI, fileAPI, routes}}>
    <PageBodyRenderer body={page.body} pageTitle={page.title} renderGallery={renderGallery}/>
</RendererProvider>
```

- `pageAPI` – implements `RendererPageApi` (declared in `src/runtime/RendererProvider.tsx`): `getPublicFileById`, `getLastItems`, `getMusicData`,
  `getGpsOverview`, `getGpsClusters`, `getGpsClusterPoints`, `getGpsTrack`, plus the optional `getPublicGalleryFiles` required by carousel hero embeds
- `fileAPI` – implements `RendererFileApi`: `getFileUrl(filePath): string`
- `routes` – implements `RendererRoutes`: `toFrontendPagePath(filePath): string`

---

## Embed tag syntax (parsed by `parseEmbeds`)

Both literal `<!--…-->` and HTML-entity-encoded `&lt;!--…--&gt;` forms are accepted.

| Tag pattern                               | Example                                                       |
|-------------------------------------------|---------------------------------------------------------------|
| ID-based (gallery/image/hero/video/audio) | `<!--vps:embed:image:42-->`                                   |
| Identifier-based (music/gps_timeseries)   | `<!--vps:embed:music:my_library-->`                           |
| YouTube URL                               | `<!--vps:embed:youtube:https://…-->`                          |
| Last items                                | `<!--vps:embed:last:images:10-->`                             |
| Collapse                                  | `<!--vps:embed:collapse:[{"title":"…","body":"…"}]-->`        |
| Carousel                                  | `<!--vps:embed:carousel:[{…}]:autoplay:dot_duration:speed-->` |

Identifier names must match `[a-z][a-z0-9_]*`. Embed types are case-insensitive; parsed types are always lowercased.

---

## Special cases

- **Gallery embeds** are the only type not self-contained: `PageBodyRenderer` accepts an optional `renderGallery` prop; without it, a fallback `<Alert>` is
  shown.
- **GpsTimeSeriesEmbed** is the only component that is **lazy-loaded** (`React.lazy`) and wrapped in `<Suspense>`; it is also the only component with a *
  *default export** (not named). All other components use named exports.
- `GpsTimeSeriesEmbed` uses icon caches (`clusterIconCache`, `pointIconCache`) as module-level `Map` objects to avoid recreating Leaflet `DivIcon` instances on
  re-render.

---

## Developer workflows

```bash
yarn install
yarn lint          # eslint . — run before committing
yarn lint:fix      # eslint . --fix
yarn test          # jest (single run)
yarn test:watch    # jest --watch
yarn test:coverage # jest --coverage
yarn build         # tsc -p tsconfig.build.json → dist/
```

`prebuild` (`node generateBuildInfo.js`) runs automatically before `build` and writes `src/buildInfo.json` (a derived artifact); `build:production` calls it
explicitly. Build output goes to `dist/`; test files and `setupTests.ts` are excluded from the build via `tsconfig.build.json`.

---

## Test conventions

- Test files live under `src/__tests__/`, mirroring the source layout (`components/`, `runtime/`, `tools/`), and are named `*.test.ts` / `*.test.tsx`.
- Jest runs under `jest-environment-jsdom`; ts-jest transforms `.ts`/`.tsx` with `tsconfig.jest.json`.
- `react-player` is stubbed via `__mocks__/react-player.tsx` (returns `<div data-testid="mock-react-player">`).
- ESM packages (`antd`, `leaflet`, `react-leaflet`, `react-player`) are whitelisted in `transformIgnorePatterns` in `jest.config.js` — add new ESM-only deps
  there if they fail to transform.
- `setupTests.ts` imports `@testing-library/jest-dom` for custom matchers.

## Key files for new embed types

1. Add the type and its fields to `PageEmbed` in `src/types.ts`.
2. Add a regex branch to `parseEmbeds` in `src/tools/parseEmbeds.ts` (and matching tests in `src/__tests__/tools/parseEmbeds.test.ts`).
3. Create `src/components/YourEmbed.tsx` using `useRendererRuntime()` for API calls.
4. Add a dispatch branch in `PageBodyRenderer.tsx`.
5. Export from `src/index.ts`.

## Additional things to consider

- When moving existing files from one location to another and the files have already been added to the git, use `git mv` to preserve the file history. If the
  files have not been added to git, you can use `mv` or your file explorer to move them, and then add the changes to git with `git add`.
- Test files must all be placed under `src/__tests__/` and named `*.test.ts` / `*.test.tsx` for Jest discovery. Subfolders reflect the main `src/`
  structure (for example `src/__tests__/components/` for embed components and `src/__tests__/tools/` for parser tests).
- Do not add TypeScript `enum`; use `as const` objects like the other Vempain frontends.
- All tasks must always be validated by running the test suite, coverage and linting before pushing commits or creating pull requests. Use `yarn test`,
  `yarn test:coverage` and `yarn lint` for this purpose. If you want to automatically fix linting issues, you can use `yarn lint:fix`.
- Treat all deprecation warnings as required maintenance work: whenever `yarn test`, `yarn test:coverage`, `yarn lint`, or build output reports deprecated
  APIs/props/behavior, update the implementation and tests immediately so no deprecation warnings remain.

## Tag ACL rule

Tags are metadata, not ACL-bearing resources. Tag entities have no ACL information, so tag list, search, and mutation endpoints must not perform ACL checks on
tags. ACL checks apply only to resources that explicitly carry an ACL.
