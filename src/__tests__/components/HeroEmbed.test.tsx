import {act, render, screen, waitFor} from '@testing-library/react';
import {HeroEmbed} from '../../components/HeroEmbed';
import {RendererProvider, type RendererRuntime} from '../../runtime/RendererProvider';

function makeRuntime(getPublicFileById: jest.Mock): RendererRuntime {
    return {
        fileAPI: {getFileUrl: (p: string) => `/hero/${p}`},
        routes: {toFrontendPagePath: (p: string) => `/pages/${p}`},
        pageAPI: {
            getPublicFileById,
            getPublicGalleryFiles: jest.fn().mockResolvedValue({
                data: {
                    content: [{id: 1, file_path: 'hero.jpg', mimetype: 'image/jpeg'}],
                    page: 0,
                    total_pages: 1,
                },
            }),
            getLastItems: jest.fn().mockResolvedValue({data: {type: 'pages', count: 0, items: []}}),
            getMusicData: jest.fn(),
            getGpsOverview: jest.fn(),
            getGpsClusters: jest.fn(),
            getGpsClusterPoints: jest.fn(),
            getGpsTrack: jest.fn(),
        },
    };
}

describe('HeroEmbed', () => {
    it('renders img with title as alt text when file_path is returned', async () => {
        const getPublicFileById = jest.fn().mockResolvedValue({data: {file_path: 'banner.jpg'}});
        render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <HeroEmbed fileId={5} title="My Page Title"/>
                </RendererProvider>
        );
        await waitFor(() => {
            expect(screen.getByAltText('My Page Title')).toBeInTheDocument();
        });
        expect(screen.getByAltText('My Page Title')).toHaveAttribute('src', '/hero/banner.jpg');
    });

    it('renders title text overlay when image loads', async () => {
        const getPublicFileById = jest.fn().mockResolvedValue({data: {file_path: 'bg.png'}});
        render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <HeroEmbed fileId={6} title="Hero Heading"/>
                </RendererProvider>
        );
        await waitFor(() => {
            expect(screen.getByText('Hero Heading')).toBeInTheDocument();
        });
    });

    it('renders gallery files as an animated hero carousel', async () => {
        const getPublicFileById = jest.fn();
        const getPublicGalleryFiles = jest.fn().mockResolvedValue({
            data: {
                content: [
                    {id: 1, file_path: 'one.jpg', mimetype: 'image/jpeg'},
                    {id: 2, file_path: 'two.mp4', mimetype: 'video/mp4'},
                ],
                page: 0,
                total_pages: 1,
            },
        });
        const runtime = makeRuntime(getPublicFileById);
        runtime.pageAPI.getPublicGalleryFiles = getPublicGalleryFiles;
        render(
                <RendererProvider value={runtime}>
                    <HeroEmbed fileId={1084} title="Carousel Hero" heroType="carousel" duration={7} transition="fade"/>
                </RendererProvider>
        );
        await waitFor(() => expect(screen.getByAltText('Carousel Hero')).toBeInTheDocument());
        expect(getPublicGalleryFiles).toHaveBeenCalledWith(1084, {page: 0, size: 100});
        expect(document.querySelector('video[src="/hero/two.mp4"]')).toBeNull();
    });

    it('renders no img when file_path is null', async () => {
        const getPublicFileById = jest.fn().mockResolvedValue({data: {file_path: null}});
        const {container} = render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <HeroEmbed fileId={7} title="No Image"/>
                </RendererProvider>
        );
        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });
        expect(container.querySelector('img')).toBeNull();
    });

    it('renders no img when API rejects', async () => {
        const getPublicFileById = jest.fn().mockRejectedValue(new Error('fail'));
        const {container} = render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <HeroEmbed fileId={8} title="Error Hero"/>
                </RendererProvider>
        );
        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });
        expect(container.querySelector('img')).toBeNull();
    });

    it('handles unmount before API resolves (covers !activeRef guard in then)', async () => {
        let resolvePromise!: (value: unknown) => void;
        const pendingPromise = new Promise((r) => {
            resolvePromise = r;
        });
        const getPublicFileById = jest.fn().mockReturnValue(pendingPromise);
        const {unmount} = render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <HeroEmbed fileId={50} title="Late Hero"/>
                </RendererProvider>
        );
        unmount();
        await act(async () => {
            resolvePromise({data: {file_path: 'late.jpg'}});
            await Promise.resolve();
        });
    });

    it('handles unmount before API rejects (covers !activeRef guard in catch)', async () => {
        let rejectPromise!: (reason: unknown) => void;
        const pendingPromise = new Promise((_r, reject) => {
            rejectPromise = reject;
        });
        const getPublicFileById = jest.fn().mockReturnValue(pendingPromise);
        const {unmount} = render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <HeroEmbed fileId={51} title="Rejected Hero"/>
                </RendererProvider>
        );
        unmount();
        await act(async () => {
            rejectPromise(new Error('late error'));
            await Promise.resolve();
        });
    });
});
