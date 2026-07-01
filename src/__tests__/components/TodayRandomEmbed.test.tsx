import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {TodayRandomEmbed} from '../../components/TodayRandomEmbed';
import {RendererProvider, type RendererRuntime} from '../../runtime/RendererProvider';

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

describe('TodayRandomEmbed', () => {
    it('renders info alert when no items are present', () => {
        render(
                <MemoryRouter>
                    <RendererProvider value={runtime}>
                        <TodayRandomEmbed options={{}}/>
                    </RendererProvider>
                </MemoryRouter>,
        );
        expect(screen.getByText('No images or pages found for this date')).toBeInTheDocument();
    });

    it('renders image and page entries', () => {
        render(
                <MemoryRouter>
                    <RendererProvider value={runtime}>
                        <TodayRandomEmbed
                                options={{
                                    images: [{id: 1, title: 'Image A', file_path: 'a.jpg', published: '2024-01-01'}],
                                    pages: [{id: 10, title: 'Page A', file_path: 'page-a', header: 'Header', published: '2024-01-01'}],
                                }}
                        />
                    </RendererProvider>
                </MemoryRouter>,
        );

        expect(screen.getByTestId('today-random-embed')).toBeInTheDocument();
        expect(screen.getByRole('img', {name: /image a/i})).toBeInTheDocument();
        expect(screen.getByRole('link', {name: /page a/i})).toHaveAttribute('href', '/pages/page-a');
    });
});
