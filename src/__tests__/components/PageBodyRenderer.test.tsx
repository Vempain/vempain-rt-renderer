import {act, render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {PageBodyRenderer} from '../../components/PageBodyRenderer';
import {RendererProvider, type RendererRuntime} from '../../runtime/RendererProvider';

jest.mock('../../components/GpsTimeSeriesEmbed', () => ({
    __esModule: true,
    default: () => <div data-testid="gps-time-series-embed">Mock GPS Time Series</div>,
}));

jest.mock('../../components/WordCloudEmbed', () => ({
    __esModule: true,
    WordCloudEmbed: () => <div data-testid="word-cloud-embed">Mock Word Cloud</div>,
}));

jest.mock('../../components/TodayRandomEmbed', () => ({
    __esModule: true,
    TodayRandomEmbed: () => <div data-testid="today-random-embed">Mock Today Random</div>,
}));

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

function wrap(ui: React.ReactNode) {
    return render(
            <MemoryRouter>
                <RendererProvider value={runtime}>{ui}</RendererProvider>
            </MemoryRouter>
    );
}

async function flush() {
    await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
    });
}

describe('PageBodyRenderer', () => {
    it('returns null for empty body', () => {
        const {container} = wrap(<PageBodyRenderer body=""/>);
        expect(container.firstChild).toBeNull();
    });

    it('renders plain HTML when there are no embed tags', () => {
        wrap(<PageBodyRenderer body="<p>Hello world</p>"/>);
        expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders html and gallery callbacks in order', () => {
        wrap(
                <PageBodyRenderer
                        body={'<p>A</p><!--vps:embed:gallery:42--><p>B</p>'}
                        renderGallery={(galleryId) => <div data-testid="gallery">Gallery {galleryId}</div>}
                />
        );
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByTestId('gallery')).toHaveTextContent('Gallery 42');
        expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('shows info alert when gallery embed has no renderGallery prop', () => {
        wrap(<PageBodyRenderer body="<!--vps:embed:gallery:5-->"/>);
        expect(screen.getByText(/Gallery 5 renderer missing/i)).toBeInTheDocument();
    });

    it('renders ImageEmbed for image type', async () => {
        wrap(<PageBodyRenderer body="<p>Before</p><!--vps:embed:image:7--><p>After</p>"/>);
        await flush();
        await waitFor(() => {
            expect(document.querySelector('img[src="/file/x.jpg"]')).not.toBeNull();
        });
    });

    it('renders HeroEmbed for hero type', async () => {
        wrap(<PageBodyRenderer body="<!--vps:embed:hero:10-->" pageTitle="Test Hero"/>);
        await flush();
        await waitFor(() => {
            expect(document.querySelector('img[alt="Test Hero"]')).not.toBeNull();
        });
    });

    it('renders a typed video hero', async () => {
        wrap(<PageBodyRenderer body="<!--vps:embed:hero:10:type:video-->" pageTitle="Video Hero"/>);
        await flush();
        await waitFor(() => expect(document.querySelector('video')).not.toBeNull());
        expect(document.querySelector('h1')).toHaveTextContent('Video Hero');
    });

    it('renders a typed carousel hero with the gallery callback', () => {
        wrap(
                <PageBodyRenderer
                        body="<!--vps:embed:hero:10:type:carousel-->"
                        renderGallery={(galleryId) => <div data-testid="hero-gallery">Gallery {galleryId}</div>}
                />
        );
        expect(screen.getByTestId('hero-gallery')).toHaveTextContent('Gallery 10');
    });

    it('renders VideoEmbed for video type', async () => {
        wrap(<PageBodyRenderer body="<!--vps:embed:video:20-->"/>);
        await flush();
        await waitFor(() => {
            expect(document.querySelector('video')).not.toBeNull();
        });
    });

    it('renders AudioEmbed for audio type', async () => {
        wrap(<PageBodyRenderer body="<!--vps:embed:audio:30-->"/>);
        await flush();
        await waitFor(() => {
            expect(document.querySelector('audio')).not.toBeNull();
        });
    });

    it('renders YouTubeEmbed for youtube type', () => {
        wrap(<PageBodyRenderer body="<!--vps:embed:youtube:https://youtu.be/abc-->"/>);
        expect(screen.getByTestId('mock-react-player')).toBeInTheDocument();
    });

    it('renders MusicDataEmbed for music type', async () => {
        wrap(<PageBodyRenderer body="<!--vps:embed:music:my_lib-->"/>);
        await flush();
        expect(screen.getByText('Music library')).toBeInTheDocument();
    });

    it('renders LastItemsEmbed for last type', async () => {
        wrap(<PageBodyRenderer body="<!--vps:embed:last:images:5-->"/>);
        await flush();
        expect(screen.getByText('View all images')).toBeInTheDocument();
    });

    it('renders WordCloudEmbed for word_cloud type', () => {
        wrap(<PageBodyRenderer body='<!--vps:embed:word_cloud:{"shape":"circle","data":[{"text":"nature","value":9}]}-->'/>);
        expect(screen.getByTestId('word-cloud-embed')).toBeInTheDocument();
    });

    it('renders TodayRandomEmbed for today_random type', () => {
        wrap(<PageBodyRenderer body='<!--vps:embed:today_random:{"images":[{"id":1,"title":"A","file_path":"a.jpg"}]}-->'/>);
        expect(screen.getByTestId('today-random-embed')).toBeInTheDocument();
    });

    it('renders CollapseEmbed for collapse type', () => {
        wrap(
                <PageBodyRenderer
                        body={'<!--vps:embed:collapse:[{"title":"FAQ","body":"<p>Answer</p>"}]-->'}
                />
        );
        expect(screen.getByText('FAQ')).toBeInTheDocument();
    });

    it('renders CarouselEmbed for carousel type', () => {
        wrap(
                <PageBodyRenderer
                        body={'<!--vps:embed:carousel:[{"title":"Slide 1","body":"<p>S1</p>"}]:false:false:500-->'}
                />
        );
        expect(screen.getByText('Slide 1')).toBeInTheDocument();
    });

    it('renders GpsTimeSeriesEmbed suspense fallback initially for gps_timeseries type', async () => {
        wrap(<PageBodyRenderer body="<!--vps:embed:gps_timeseries:my_track-->"/>);
        expect(await screen.findByTestId('gps-time-series-embed')).toBeInTheDocument();
    });

    it('renders multiple embeds interleaved with HTML', async () => {
        wrap(
                <PageBodyRenderer
                        body={
                                '<p>Intro</p>' +
                                '<!--vps:embed:collapse:[{"title":"Q","body":"A"}]-->' +
                                '<p>Footer</p>'
                        }
                />
        );
        expect(screen.getByText('Intro')).toBeInTheDocument();
        expect(screen.getByText('Q')).toBeInTheDocument();
        expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('renders tail HTML after the last embed', () => {
        wrap(
                <PageBodyRenderer
                        body={'<!--vps:embed:collapse:[{"title":"T","body":"B"}]--><p>Tail text</p>'}
                />
        );
        expect(screen.getByText('Tail text')).toBeInTheDocument();
    });
});
