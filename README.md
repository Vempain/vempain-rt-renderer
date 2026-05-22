# vempain-rt-renderer

Reusable React renderer for Vempain rich-text page bodies and embed tags.

## What this package provides

- `PageBodyRenderer` to render mixed HTML and `<!--vps:embed:*-->` tags
- Embed components for image/hero/video/audio/youtube/music/gps/last/collapse/carousel
- `RendererProvider` context for wiring host APIs and route helpers
- `parseEmbeds` parser utility + tests

## Install

```bash
yarn add @vempain/vempain-rt-renderer
```

## Local development

```bash
yarn install
yarn lint
yarn test
yarn build
```

