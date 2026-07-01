# vempain-rt-renderer

Reusable React renderer for Vempain rich-text page bodies and embed tags.

## What this package provides

- `PageBodyRenderer` to render mixed HTML and `<!--vps:embed:*-->` tags
- Embed components for image/hero/video/audio/youtube/music/gps/last/word-cloud/today-random/collapse/carousel
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

## Today random embed

`PageBodyRenderer` also supports:

```html
<!--vps:embed:today_random:{"title":"On this day","images":[{"id":1,"title":"Sunrise","file_path":"images/sunrise.jpg","published":"2024-08-10T09:00:00"}],"pages":[{"id":10,"title":"Trip diary","header":"Intro","file_path":"trips/diary","published":"2024-08-10T09:00:00"}]}-->
```

The renderer expects backend-injected `images` (up to 5) and `pages` (up to 2), and shows an info message when both are empty.
