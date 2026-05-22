import {render, screen} from '@testing-library/react';
import {PageBodyRenderer} from './PageBodyRenderer';
import {RendererProvider, type RendererRuntime} from '../runtime/RendererProvider';

const runtime: RendererRuntime = {
    fileAPI: {
        getFileUrl: (filePath: string) => `/file/${filePath}`,
    },
    routes: {
        toFrontendPagePath: (path: string) => `/pages/${path}`,
    },
    pageAPI: {
        getPublicFileById: async () => ({data: {file_path: 'x.jpg'}}),
        getLastItems: async () => ({data: {type: 'pages', count: 1, items: []}}),
        getMusicData: async () => ({
            data: {
                identifier: 'music',
                items: [],
                page: 0,
                size: 25,
                total_elements: 0,
                total_pages: 0,
                first: true,
                last: true,
                sort_by: 'artist',
                direction: 'asc',
                search: '',
            }
        }),
        getGpsOverview: async () => ({data: {identifier: 'gps', point_count: 0, bounds: null}}),
        getGpsClusters: async () => ({data: {identifier: 'gps', zoom: 6, items: [], bounds: null}}),
        getGpsClusterPoints: async () => ({
            data: {
                identifier: 'gps',
                cluster_key: 'c',
                bounds: {min_latitude: 0, max_latitude: 0, min_longitude: 0, max_longitude: 0},
                items: []
            }
        }),
        getGpsTrack: async () => ({
            data: {
                identifier: 'gps',
                total_points: 0,
                sampled_points: 0,
                sample_step: 1,
                items: []
            }
        }),
    },
};

describe('PageBodyRenderer', () => {
    it('renders html and gallery callbacks in order', () => {
        render(
            <RendererProvider value={runtime}>
                <PageBodyRenderer
                    body={'<p>A</p><!--vps:embed:gallery:42--><p>B</p>'}
                    renderGallery={(galleryId) => <div data-testid="gallery">Gallery {galleryId}</div>}
                />
            </RendererProvider>
        );

        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByTestId('gallery')).toHaveTextContent('Gallery 42');
        expect(screen.getByText('B')).toBeInTheDocument();
    });
});

