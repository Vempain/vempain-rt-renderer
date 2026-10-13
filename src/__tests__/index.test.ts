// The GPS embed pulls in react-leaflet, whose core package is ESM only; the barrel test only needs the export to exist
jest.mock('leaflet', () => ({__esModule: true, default: {divIcon: jest.fn()}, divIcon: jest.fn()}));
jest.mock('react-leaflet', () => ({
    __esModule: true, MapContainer: () => null, Marker: () => null, Polyline: () => null, Popup: () => null,
    TileLayer: () => null, useMap: () => ({})
}));

import * as library from '../index';

/**
 * The barrel is the published API surface: every runtime export must be present, so a renamed or dropped export is caught here
 * before the consumers (the website frontend and the product site docs) break.
 */
describe('library entry point', () => {
    it('exports the provider, the parser and every embed component', () => {
        const expected = [
            'RendererProvider', 'useRendererRuntime', 'parseEmbeds', 'PageBodyRenderer', 'ImageEmbed', 'HeroEmbed', 'CollapseEmbed',
            'CarouselEmbed', 'VideoEmbed', 'AudioEmbed', 'MusicDataEmbed', 'YouTubeEmbed', 'LastItemsEmbed', 'WordCloudEmbed',
            'TodayRandomEmbed', 'GpsTimeSeriesEmbed',
        ];
        for (const name of expected) {
            expect(typeof (library as Record<string, unknown>)[name]).toMatch(/function|object/);
        }
        expect(Object.keys(library).sort()).toEqual([...expected].sort());
    });
});
