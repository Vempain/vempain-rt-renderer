---
name: add-embed-type
description: Add or change an embed type rendered by vempain-rt-renderer (PageEmbed type, parseEmbeds branch, component using the runtime, PageBodyRenderer dispatch, exports) in step with the editor and the hosts. Use for any embed parsing or rendering change.
---

# Add an embed type to vempain-rt-renderer

1. Add the type and its fields to `PageEmbed` in `src/types.ts`.
2. Add the parsing branch to `src/tools/parseEmbeds.ts` (literal `<!--…-->` and entity-encoded forms, types lowercased, identifiers
   `[a-z][a-z0-9_]*`) with tests in `src/__tests__/tools/parseEmbeds.test.ts`.
3. Create `src/components/<Name>Embed.tsx`; get host APIs through `useRendererRuntime()` (`pageAPI`: `RendererPageApi`, `fileAPI`:
   `getFileUrl`, `routes`: `toFrontendPagePath`). Named export; only `GpsTimeSeriesEmbed` is lazy with a default export.
4. Add the dispatch branch in `src/components/PageBodyRenderer.tsx` (gallery embeds stay delegated to the host's `renderGallery` prop).
5. Export from `src/index.ts`; extend `RendererPageApi` only when a new host API is unavoidable and document it in
   `AGENTS.integration.md`.
6. Keep the editor (`vempain-rt-editor` `embedTools.ts`), the hosts (`vempain-website-frontend` `rendererRuntime.ts`, `vempain-admin-frontend`)
   and the docs in `vempain-site` (`src/components/RtRenderer.tsx`) in step; the embed tag table must stay identical everywhere.
7. Tests in `src/__tests__/components/` (jsdom, `@testing-library/jest-dom`; `react-player` mocked; add new ESM-only deps to
   `transformIgnorePatterns`). Bump `VERSION`; `yarn lint`, `yarn test`, `yarn test:coverage`, `yarn build` clean, no deprecation warnings.
