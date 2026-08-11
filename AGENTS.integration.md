# Integrating `@vempain/vempain-rt-renderer`

This document is an implementation guide for an AI agent integrating Vempain page-body rendering into a new React frontend. The package parses canonical HTML
containing Vempain embed comment tags and replaces supported tags with React components.

## Resources

- Package repository: https://github.com/Vempain/vempain-rt-renderer
- Editor repository: https://github.com/Vempain/vempain-rt-editor
- Example renderer host: https://github.com/Vempain/vempain-website
- Example host runtime: https://github.com/Vempain/vempain-website/blob/main/frontend/src/rendererRuntime.ts

Read `src/index.ts`, `src/components/PageBodyRenderer.tsx`, and
`src/runtime/RendererProvider.tsx` when published declarations differ from this guide.

## Installation

The package is published in the GitHub Packages npm registry:

```bash
yarn config set npmScopes.vempain.npmRegistryServer https://npm.pkg.github.com
yarn add @vempain/vempain-rt-renderer
```

The host application must provide these peer dependencies:

- `react` and `react-dom` 19
- `antd` 6
- `@ant-design/charts` 2
- `leaflet` 1.9
- `react-leaflet` 5
- `react-player` 3
- `react-router-dom` 7

Leaflet CSS must be imported by the host, and Leaflet marker assets may need explicit bundler configuration. The website host configures marker URLs in
`main.tsx` before rendering the app.

## Required runtime provider

Every renderer embed obtains its API clients through `useRendererRuntime()`. Wrap the application or the route containing rendered pages in `RendererProvider`
before mounting
`PageBodyRenderer`:

```tsx
import {RendererProvider, PageBodyRenderer} from '@vempain/vempain-rt-renderer';

const runtime = {
    pageAPI,
    fileAPI,
    routes: {
        toFrontendPagePath: (filePath: string) => `/pages/${filePath}`
    }
};

export function App() {
    return (
            <RendererProvider value={runtime}>
                <PageBodyRenderer
                        body={page.body}
                        pageTitle={page.title}
                        renderGallery={(galleryId, index) => (
                                <GalleryView key={`gallery-${galleryId}-${index}`} galleryId={galleryId}/>
                        )}
                />
            </RendererProvider>
    );
}
```

The provider is mandatory. Omitting it throws `Renderer runtime missing. Wrap app with
<RendererProvider>.` at runtime.

`RendererRuntime` has three required sections:

```ts
interface RendererRuntime {
    pageAPI: RendererPageApi;
    fileAPI: RendererFileApi;
    routes: RendererRoutes;
}
```

`RendererPageApi` must implement:

```ts
getPublicFileById(id
:
number
):
Promise<ApiResponse<{
    file_path?: string | null;
    thumbnail_path?: string | null;
}>>;
getLastItems(type
:
LastEmbedType, count
:
number
):
Promise<ApiResponse<LastItemsResponse>>;
getMusicData(identifier
:
string, params
:
{
    page ? : number;
    perPage ? : number;
    sortBy ? : string;
    direction ? : 'asc' | 'desc';
    search ? : string;
}
):
Promise<ApiResponse<MusicDataResponse>>;
getGpsOverview(identifier
:
string
):
Promise<ApiResponse<GpsOverviewResponse>>;
getGpsClusters(identifier
:
string, params
:
{
    zoom: number;
    minLat ? : number;
    maxLat ? : number;
    minLng ? : number;
    maxLng ? : number;
}
):
Promise<ApiResponse<GpsClustersResponse>>;
getGpsClusterPoints(identifier
:
string, clusterKey
:
string, limit ? : number
):
Promise<ApiResponse<GpsClusterPointsResponse>>;
getGpsTrack(identifier
:
string, maxPoints ? : number
):
Promise<ApiResponse<GpsTrackResponse>>;
```

`ApiResponse<T>` is `{data?: T; error?: string; status?: number}`. `RendererFileApi` implements
`getFileUrl(filePath: string): string`, and `RendererRoutes` implements
`toFrontendPagePath(filePath: string): string`.

The host should return absolute or correctly base-prefixed URLs from `getFileUrl`. The renderer passes file paths from API responses directly to this callback.

## `PageBodyRenderer` props

| Prop            | Type                                                    | Meaning                                                            |
|-----------------|---------------------------------------------------------|--------------------------------------------------------------------|
| `body`          | `string`                                                | Canonical HTML page body. Empty content renders nothing.           |
| `pageTitle`     | `string`                                                | Optional title passed to hero embeds. Defaults to an empty string. |
| `renderGallery` | `(galleryId: number, index: number) => React.ReactNode` | Optional host gallery renderer.                                    |

Gallery embeds are the only embeds that require host rendering. If `renderGallery` is omitted, the component displays an informational fallback instead of
silently dropping the gallery.

## Supported tags

The parser accepts literal and HTML-entity-encoded comment tags:

```html
<!--vps:embed:image:42-->
<!--vps:embed:music:my_library-->
<!--vps:embed:youtube:https://www.youtube.com/watch?v=abc-->
<!--vps:embed:last:images:10-->
<!--vps:embed:collapse:[{"title":"Details","body":"More information"}]-->
<!--vps:embed:carousel:[{"id":42}]:true:false:500-->
```

The supported types are gallery, image, hero, video, audio, youtube, music, gps_timeseries, last, word_cloud, today_random, collapse, and carousel. Identifiers
must match the package's lowercase identifier rules. Embed types are case-insensitive and are normalized to lowercase.

`PageBodyRenderer` exports the standard embed components through the package root for advanced use, including `ImageEmbed`, `HeroEmbed`, `CollapseEmbed`,
`CarouselEmbed`, `VideoEmbed`,
`AudioEmbed`, `MusicDataEmbed`, `YouTubeEmbed`, `LastItemsEmbed`, `WordCloudEmbed`,
`TodayRandomEmbed`, and `GpsTimeSeriesEmbed`. Prefer `PageBodyRenderer` unless the host needs a custom layout or an individual embed.

## Host integration checklist

1. Install the package and all peer dependencies.
2. Import `leaflet/dist/leaflet.css` and configure marker assets if required by the bundler.
3. Implement all `RendererPageApi` methods used by the embed types enabled in the application.
4. Implement `getFileUrl` and `toFrontendPagePath` using the host's API and routing conventions.
5. Wrap the application in `RendererProvider`.
6. Pass stored page body HTML to `PageBodyRenderer`; do not sanitize away Vempain comment tags.
7. Supply `renderGallery` if gallery embeds are present.
8. Handle authentication and API errors in the runtime adapters, returning the documented
   `ApiResponse` shape.

The website reference integration is in `frontend/src/main.tsx`, `frontend/src/rendererRuntime.ts`, and `frontend/src/components/PageView.tsx`.
