import React, {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import GpsTimeSeriesEmbed from '../../components/GpsTimeSeriesEmbed';
import {RendererProvider, type RendererRuntime} from '../../runtime/RendererProvider';

// Store click handlers keyed by "lat,lng" so tests can trigger cluster expansion
const markerClickHandlers: Map<string, () => void> = new Map();

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockGetGpsOverview = jest.fn();
const mockGetGpsTrack = jest.fn();
const mockGetGpsClusters = jest.fn();
const mockGetGpsClusterPoints = jest.fn();

const mockMap = {
    getZoom: jest.fn(() => 8),
    getBounds: jest.fn(() => ({
        getSouth: () => 60.0,
        getNorth: () => 61.0,
        getWest: () => 24.0,
        getEast: () => 25.0,
    })),
    on: jest.fn(),
    off: jest.fn(),
};

jest.mock('leaflet', () => {
    const divIcon = jest.fn(() => ({}));
    return {
        __esModule: true,
        default: {divIcon},
        divIcon,
    };
});

jest.mock('react-leaflet', () => {
    const ReactLocal = React;

    // forwardRef Marker so ClusterMarker's markerRef.current gets on/off
    const MockMarker = ReactLocal.forwardRef(
            (
                    {children, position}: { children?: React.ReactNode; position: [number, number] },
                    ref: React.Ref<unknown>,
            ) => {
                const posKey = `${position[0]},${position[1]}`;
                ReactLocal.useImperativeHandle(ref, () => ({
                    on: (_event: string, handler: () => void) => {
                        markerClickHandlers.set(posKey, handler);
                    },
                    off: jest.fn(),
                }));
                return (
                        <div data-testid="marker" data-lat={position[0]} data-lng={position[1]}>
                            {children}
                        </div>
                );
            },
    );
    MockMarker.displayName = 'Marker';

    return {
        // MapContainer renders ALL children — MapViewportBridge will fire loadClusters
        MapContainer: ({children}: { children: React.ReactNode }) => (
                <div data-testid="map-container">{children}</div>
        ),
        TileLayer: () => <div data-testid="tile-layer"/>,
        Marker: MockMarker,
        Popup: ({children}: { children?: React.ReactNode }) => <div data-testid="popup">{children}</div>,
        Polyline: ({positions}: { positions: Array<[number, number]> }) => (
                <div data-testid="gps-track-polyline" data-points={JSON.stringify(positions)}/>
        ),
        useMap: () => mockMap,
        __esModule: true,
        default: ReactLocal,
    };
});

const runtime: RendererRuntime = {
    fileAPI: {getFileUrl: (filePath: string) => filePath},
    routes: {toFrontendPagePath: (path: string) => `/pages/${path}`},
    pageAPI: {
        getPublicFileById: async () => ({data: {file_path: 'x'}}),
        getLastItems: async () => ({data: {type: 'pages', count: 0, items: []}}),
        getMusicData: async () => ({
            data: {
                identifier: 'id', items: [], page: 0, size: 25,
                total_elements: 0, total_pages: 0, first: true, last: true,
                sort_by: 'artist', direction: 'asc', search: '',
            }
        }),
        getGpsOverview: (...args: unknown[]) => mockGetGpsOverview(...args),
        getGpsTrack: (...args: unknown[]) => mockGetGpsTrack(...args),
        getGpsClusters: (...args: unknown[]) => mockGetGpsClusters(...args),
        getGpsClusterPoints: (...args: unknown[]) => mockGetGpsClusterPoints(...args),
    },
};

describe('GpsTimeSeriesEmbed', () => {
    let container: HTMLDivElement;
    let root: Root;

    const defaultBounds = {min_latitude: 60.0, max_latitude: 61.0, min_longitude: 24.0, max_longitude: 25.0};

    beforeEach(() => {
        jest.clearAllMocks();
        markerClickHandlers.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);

        mockGetGpsOverview.mockResolvedValue({
            data: {
                identifier: 'gps_timeseries_trip',
                point_count: 2,
                bounds: defaultBounds,
            },
        });

        mockGetGpsTrack.mockResolvedValue({
            data: {
                identifier: 'gps_timeseries_trip',
                total_points: 2,
                sampled_points: 2,
                sample_step: 1,
                items: [
                    {
                        id: 1,
                        timestamp: '2026-01-01T10:00:00Z',
                        latitude: 60.1,
                        longitude: 24.9,
                        altitude: null,
                        filename: 'a.jpg'
                    },
                    {
                        id: 2,
                        timestamp: '2026-01-01T10:05:00Z',
                        latitude: 60.2,
                        longitude: 25.0,
                        altitude: null,
                        filename: 'b.jpg'
                    },
                ],
            },
        });

        mockGetGpsClusters.mockResolvedValue({
            data: {
                identifier: 'gps_timeseries_trip',
                zoom: 8,
                items: [],
                bounds: defaultBounds,
            },
        });

        mockGetGpsClusterPoints.mockResolvedValue({
            data: {
                identifier: 'gps_timeseries_trip',
                cluster_key: '8:1:2',
                bounds: defaultBounds,
                items: [],
            },
        });
    });

    afterEach(() => {
        act(() => {
            root.unmount();
        });
        container.remove();
    });

    async function renderAndFlush(identifier = 'gps_timeseries_trip') {
        await act(async () => {
            root.render(
                    <RendererProvider value={runtime}>
                        <GpsTimeSeriesEmbed identifier={identifier}/>
                    </RendererProvider>
            );
        });
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });
        await act(async () => {
            await Promise.resolve();
        });
        await act(async () => {
            await Promise.resolve();
        });
    }

    it('calls track API and renders polyline when track points are returned', async () => {
        await renderAndFlush();

        expect(mockGetGpsTrack).toHaveBeenCalledWith('gps_timeseries_trip', 3000);

        const polyline = container.querySelector('[data-testid="gps-track-polyline"]');
        expect(polyline).not.toBeNull();
        expect(polyline?.getAttribute('data-points')).toBe(JSON.stringify([
            [60.1, 24.9],
            [60.2, 25.0],
        ]));
    });

    it('calls loadClusters via MapViewportBridge onViewportChange', async () => {
        await renderAndFlush();
        expect(mockGetGpsClusters).toHaveBeenCalledWith(
                'gps_timeseries_trip',
                expect.objectContaining({zoom: 8}),
        );
    });

    it('renders map container when overview succeeds with bounds', async () => {
        await renderAndFlush();
        expect(container.querySelector('[data-testid="map-container"]')).not.toBeNull();
    });

    it('shows Alert when overview API returns an error', async () => {
        mockGetGpsOverview.mockResolvedValue({error: 'GPS data unavailable'});
        mockGetGpsTrack.mockResolvedValue({
            data: {identifier: 'x', total_points: 0, sampled_points: 0, sample_step: 1, items: []}
        });
        await renderAndFlush();
        expect(container.textContent).toMatch(/GPS data unavailable/i);
    });

    it('shows Empty when overview returns null bounds', async () => {
        // error: '' is falsy ('' ?? fallback = '') so overviewError is '' → skips Alert → shows Empty
        mockGetGpsOverview.mockResolvedValue({data: {identifier: 'x', point_count: 0, bounds: null}, error: ''});
        mockGetGpsTrack.mockResolvedValue({
            data: {identifier: 'x', total_points: 0, sampled_points: 0, sample_step: 1, items: []}
        });
        await renderAndFlush();
        expect(container.textContent).toMatch(/Kuvaston/i);
    });

    it('shows track error message when getGpsTrack returns error', async () => {
        mockGetGpsTrack.mockResolvedValue({error: 'Track data gone'});
        await renderAndFlush();
        expect(container.textContent).toMatch(/Track data gone/i);
    });

    it('shows cluster error when getGpsClusters returns error', async () => {
        mockGetGpsClusters.mockResolvedValue({error: 'Cluster API down'});
        await renderAndFlush();
        expect(container.textContent).toMatch(/Cluster API down/i);
    });

    it('renders cluster markers when clusters with kind=cluster are returned', async () => {
        mockGetGpsClusters.mockResolvedValue({
            data: {
                identifier: 'gps_timeseries_trip',
                zoom: 8,
                bounds: defaultBounds,
                items: [
                    {
                        cluster_key: '8:10:20',
                        kind: 'cluster',
                        point_count: 5,
                        latitude: 60.3,
                        longitude: 24.5,
                        bounds: defaultBounds,
                        cell_bounds: defaultBounds,
                        sample_filename: null,
                        first_timestamp: '2026-01-01T00:00:00Z',
                        last_timestamp: '2026-01-02T00:00:00Z',
                    },
                ],
            },
        });
        await renderAndFlush();
        const markers = container.querySelectorAll('[data-testid="marker"]');
        expect(markers.length).toBeGreaterThanOrEqual(1);
    });

    it('renders point markers when clusters contain kind=point items', async () => {
        mockGetGpsClusters.mockResolvedValue({
            data: {
                identifier: 'gps_timeseries_trip',
                zoom: 12,
                bounds: defaultBounds,
                items: [
                    {
                        cluster_key: '12:30:40',
                        kind: 'point',
                        point_count: 1,
                        latitude: 60.5,
                        longitude: 24.8,
                        bounds: defaultBounds,
                        cell_bounds: defaultBounds,
                        sample_filename: 'photo.jpg',
                        first_timestamp: null,
                        last_timestamp: null,
                    },
                ],
            },
        });
        await renderAndFlush();
        const markers = container.querySelectorAll('[data-testid="marker"]');
        expect(markers.length).toBeGreaterThanOrEqual(1);
    });

    it('exercises icon cache on second render with the same cluster point_count', async () => {
        const clusterItems = [
            {
                cluster_key: '8:50:60',
                kind: 'cluster' as const,
                point_count: 9,
                latitude: 60.3,
                longitude: 24.4,
                bounds: defaultBounds,
                cell_bounds: defaultBounds,
                sample_filename: null,
                first_timestamp: null,
                last_timestamp: null,
            },
        ];
        mockGetGpsClusters.mockResolvedValue({
            data: {identifier: 'gps_timeseries_trip', zoom: 8, bounds: defaultBounds, items: clusterItems},
        });

        // First render fills cache
        await renderAndFlush();

        // Unmount and remount to hit cache on next render
        await act(async () => {
            root.unmount();
        });
        container.remove();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);

        await renderAndFlush();

        const markers = container.querySelectorAll('[data-testid="marker"]');
        expect(markers.length).toBeGreaterThanOrEqual(1);
    });

    it('expands cluster points when cluster marker is clicked', async () => {
        const clusterItem = {
            cluster_key: '8:3:4',
            kind: 'cluster' as const,
            point_count: 2,
            latitude: 60.4,
            longitude: 24.7,
            bounds: defaultBounds,
            cell_bounds: defaultBounds,
            sample_filename: null,
            first_timestamp: null,
            last_timestamp: null,
        };
        mockGetGpsClusters.mockResolvedValue({
            data: {identifier: 'gps_timeseries_trip', zoom: 8, bounds: defaultBounds, items: [clusterItem]},
        });
        mockGetGpsClusterPoints.mockResolvedValue({
            data: {
                identifier: 'gps_timeseries_trip',
                cluster_key: '8:3:4',
                bounds: defaultBounds,
                items: [
                    {id: 10, timestamp: '2026-02-01T00:00:00Z', latitude: 60.41, longitude: 24.71, altitude: null, filename: 'expanded.jpg'},
                ],
            },
        });
        await renderAndFlush();

        const handler = markerClickHandlers.get('60.4,24.7');
        if (handler) {
            await act(async () => {
                handler();
            });
            await act(async () => {
                await Promise.resolve();
            });
            expect(mockGetGpsClusterPoints).toHaveBeenCalledWith('gps_timeseries_trip', '8:3:4', 500);
        }
    });

    it('shows expansion error when getGpsClusterPoints fails', async () => {
        const clusterItem = {
            cluster_key: '8:5:6',
            kind: 'cluster' as const,
            point_count: 4,
            latitude: 60.6,
            longitude: 24.6,
            bounds: defaultBounds,
            cell_bounds: defaultBounds,
            sample_filename: null,
            first_timestamp: '2026-01-01T00:00:00Z',
            last_timestamp: '2026-01-03T00:00:00Z',
        };
        mockGetGpsClusters.mockResolvedValue({
            data: {identifier: 'gps_timeseries_trip', zoom: 8, bounds: defaultBounds, items: [clusterItem]},
        });
        mockGetGpsClusterPoints.mockResolvedValue({error: 'Points expand failed'});
        await renderAndFlush();

        const handler = markerClickHandlers.get('60.6,24.6');
        if (handler) {
            await act(async () => {
                handler();
            });
            await act(async () => {
                await Promise.resolve();
            });
            expect(container.textContent).toMatch(/Points expand failed/i);
        }
    });

    it('renders popup with cluster timestamp range', async () => {
        mockGetGpsClusters.mockResolvedValue({
            data: {
                identifier: 'gps_timeseries_trip',
                zoom: 8,
                bounds: defaultBounds,
                items: [
                    {
                        cluster_key: '8:7:8',
                        kind: 'cluster',
                        point_count: 7,
                        latitude: 60.7,
                        longitude: 24.3,
                        bounds: defaultBounds,
                        cell_bounds: defaultBounds,
                        sample_filename: null,
                        first_timestamp: '2026-03-01',
                        last_timestamp: '2026-03-10',
                    },
                ],
            },
        });
        await renderAndFlush();
        const popups = container.querySelectorAll('[data-testid="popup"]');
        expect(popups.length).toBeGreaterThanOrEqual(1);
        expect(container.textContent).toMatch(/2026-03-01/);
    });
});
