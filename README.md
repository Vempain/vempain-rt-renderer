# vempain-rt-renderer

Reusable React renderer for Vempain rich-text page bodies and embed tags.

## What this package provides

- `PageBodyRenderer` to render mixed HTML and `<!--vps:embed:*-->` tags
- Embed components for image/hero/video/audio/youtube/music/gps/last/word-cloud/collapse/carousel
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

## Word cloud embed

`PageBodyRenderer` now supports:

```html
<!--vps:embed:word_cloud:{"shape":"circle","fontSize":[14,56],"data":[{"text":"nature","value":24}]}-->
```

`data` must be an array of `{ text, value }` objects, which matches Ant Design Charts `WordCloud` input.
