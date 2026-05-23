import {act, render, waitFor} from '@testing-library/react';
import {AudioEmbed} from '../../components/AudioEmbed';
import {RendererProvider, type RendererRuntime} from '../../runtime/RendererProvider';

function makeRuntime(getPublicFileById: jest.Mock): RendererRuntime {
    return {
        fileAPI: {getFileUrl: (p: string) => `/audio/${p}`},
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

describe('AudioEmbed', () => {
    it('renders an audio element when file_path is returned', async () => {
        const getPublicFileById = jest.fn().mockResolvedValue({data: {file_path: 'song.mp3'}});
        render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <AudioEmbed fileId={1}/>
                </RendererProvider>
        );
        await waitFor(() => {
            expect(document.querySelector('audio[src="/audio/song.mp3"]')).not.toBeNull();
        });
    });

    it('renders no audio element when file_path is null', async () => {
        const getPublicFileById = jest.fn().mockResolvedValue({data: {file_path: null}});
        const {container} = render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <AudioEmbed fileId={2}/>
                </RendererProvider>
        );
        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });
        expect(container.querySelector('audio')).toBeNull();
    });

    it('renders no audio element when API rejects', async () => {
        const getPublicFileById = jest.fn().mockRejectedValue(new Error('fail'));
        const {container} = render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <AudioEmbed fileId={3}/>
                </RendererProvider>
        );
        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });
        expect(container.querySelector('audio')).toBeNull();
    });

    it('audio element has controls attribute', async () => {
        const getPublicFileById = jest.fn().mockResolvedValue({data: {file_path: 'track.ogg'}});
        render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <AudioEmbed fileId={4}/>
                </RendererProvider>
        );
        await waitFor(() => {
            const audioEl = document.querySelector('audio');
            expect(audioEl).not.toBeNull();
            expect(audioEl!.hasAttribute('controls')).toBe(true);
        });
    });

    it('handles unmount before API resolves (covers !activeRef guard in then)', async () => {
        let resolvePromise!: (value: unknown) => void;
        const pendingPromise = new Promise((r) => {
            resolvePromise = r;
        });
        const getPublicFileById = jest.fn().mockReturnValue(pendingPromise);
        const {unmount} = render(
                <RendererProvider value={makeRuntime(getPublicFileById)}>
                    <AudioEmbed fileId={50}/>
                </RendererProvider>
        );
        unmount();
        await act(async () => {
            resolvePromise({data: {file_path: 'late.mp3'}});
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
                    <AudioEmbed fileId={51}/>
                </RendererProvider>
        );
        unmount();
        await act(async () => {
            rejectPromise(new Error('late error'));
            await Promise.resolve();
        });
    });
});

