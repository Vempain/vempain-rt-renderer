---
name: validate-library
description: Validate the rich-text renderer library (lint, tests, coverage, build, deprecation warnings, ESM transform list). Use before reporting any change as done.
---

# Validate vempain-rt-renderer

- Commands: `yarn lint`, `yarn test`, `yarn test:coverage`, `yarn build` (`tsc -p tsconfig.build.json` to `dist/`); resolve every error,
  warning and deprecation before finishing.
- Jest runs under `jest-environment-jsdom` with `tsconfig.jest.json`; `antd`, `leaflet`, `react-leaflet`, `react-player` are whitelisted in
  `transformIgnorePatterns` (`jest.config.js`), add other ESM-only dependencies there; `react-player` is stubbed in `__mocks__/`.
- Tests only in `src/__tests__/` mirroring `src/` (`components/`, `runtime/`, `tools/`). No TypeScript `enum`. Move tracked files with
  `git mv`.
- `prebuild` writes `src/buildInfo.json` (derived). CI is `frontend-library.yaml` of `vempain-workflows`; bump `VERSION` for a release and
  update `vempain-website-frontend` and the `vempain-site` docs.
