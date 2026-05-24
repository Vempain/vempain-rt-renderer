import {act, render, waitFor} from '@testing-library/react';
import {ImageEmbed} from '../../components/ImageEmbed';
import {RendererProvider, type RendererRuntime} from '../../runtime/RendererProvider';

function makeRuntime(getPublicFileById: jest.Mock): RendererRuntime {
    return {
        fileAPI: {getFileUrl: (p: string) => `/files/${p}`},
        routes: {toFrontendPagePath: (p: string) => `/pages/${p}`},
        pageAPI: {
            getPublicFileById,
            getLastItems: jest.fn().mockResolvedValue({data: {type: 'pages', count: 0, items: []}}),
            getMusicData: jest.fn(),
            getGpsOverview: jest.fn(),
            getGpsClusters: jest.fn(),
            getGpsClusterPoints: jest.fn(),
            getGpsTrack: jest.fn(),
        },
    };
}

describe('ImageEmbed', () => {
    it('renders an img element when file_path is returned', async () => {
        const getPublicFileById = jest.fn().mockResolvedValue({data: {file_path: 'photo.jpg'}});
        render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <ImageEmbed fileId={7}/>
                </RendererProvider>
        );
        await waitFor(() => {
            expect(document.querySelector('img[src="/files/photo.jpg"]')).not.toBeNull();
        });
    });

    it('renders no img when file_path is null', async () => {
        const getPublicFileById = jest.fn().mockResolvedValue({data: {file_path: null}});
        const {container} = render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <ImageEmbed fileId={8}/>
                </RendererProvider>
        );
        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });
        expect(container.querySelector('img[src^="/files/"]')).toBeNull();
    });

    it('renders no img when file_path is undefined', async () => {
        const getPublicFileById = jest.fn().mockResolvedValue({data: {}});
        const {container} = render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <ImageEmbed fileId={9}/>
                </RendererProvider>
        );
        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });
        expect(container.querySelector('img[src^="/files/"]')).toBeNull();
    });

    it('handles API rejection gracefully', async () => {
        const getPublicFileById = jest.fn().mockRejectedValue(new Error('Network error'));
        const {container} = render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <ImageEmbed fileId={10}/>
                </RendererProvider>
        );
        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });
        expect(container.querySelector('img[src^="/files/"]')).toBeNull();
    });

    it('handles component unmount before API resolves (covers !activeRef guard)', async () => {
        let resolvePromise!: (value: unknown) => void;
        const pendingPromise = new Promise((r) => {
            resolvePromise = r;
        });
        const getPublicFileById = jest.fn().mockReturnValue(pendingPromise);
        const {unmount} = render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <ImageEmbed fileId={99}/>
                </RendererProvider>
        );
        unmount();
        await act(async () => {
            resolvePromise({data: {file_path: 'late.jpg'}});
            await Promise.resolve();
        });
    });

    it('handles component unmount before API rejects (covers !activeRef in catch)', async () => {
        let rejectPromise!: (reason: unknown) => void;
        const pendingPromise = new Promise((_r, reject) => {
            rejectPromise = reject;
        });
        const getPublicFileById = jest.fn().mockReturnValue(pendingPromise);
        const {unmount} = render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <ImageEmbed fileId={100}/>
                </RendererProvider>
        );
        unmount();
        await act(async () => {
            rejectPromise(new Error('late error'));
            await Promise.resolve();
        });
    });
});

