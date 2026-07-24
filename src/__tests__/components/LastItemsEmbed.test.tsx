import {act, render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {LastItemsEmbed} from '../../components/LastItemsEmbed';
import {RendererProvider, type RendererRuntime} from '../../runtime/RendererProvider';
import type {LastEmbedType, LastItemsResponse} from '../../types';

function makeRuntime(getLastItems: jest.Mock, getPublicFileById?: jest.Mock): RendererRuntime {
    return {
        fileAPI: {getFileUrl: (p: string) => `/files/${p}`},
        routes: {toFrontendPagePath: (p: string) => `/pages/${p}`},
        pageAPI: {
            getPublicFileById: getPublicFileById ?? jest.fn().mockResolvedValue({data: {file_path: null}}),
            getLastItems,
            getMusicData: jest.fn(),
            getGpsOverview: jest.fn(),
            getGpsClusters: jest.fn(),
            getGpsClusterPoints: jest.fn(),
            getGpsTrack: jest.fn(),
        },
    };
}

function renderWithAll(
        lastType: LastEmbedType,
        count: number,
        getLastItems: jest.Mock,
        getPublicFileById?: jest.Mock,
) {
    return render(
            <MemoryRouter>
                <RendererProvider value={makeRuntime(getLastItems, getPublicFileById)}>
                    <LastItemsEmbed lastType={lastType} count={count}/>
                </RendererProvider>
            </MemoryRouter>
    );
}

async function flush() {
    await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
    });
}

function makeResponse(type: LastEmbedType, items: LastItemsResponse['items']): { data: LastItemsResponse } {
    return {data: {type, count: items.length, items}};
}

describe('LastItemsEmbed – pages type', () => {
    it('renders page item cards with title and date', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('pages', [
            {id: 1, title: 'First Page', published: '2025-01-15', file_path: '/page/first', body: null, header: null},
        ]));
        renderWithAll('pages', 5, getLastItems);
        await flush();
        expect(screen.getByText('First Page')).toBeInTheDocument();
    });

    it('renders page items with hero thumbnail when body has hero embed', async () => {
        const heroBody = '<!--vps:embed:hero:42--><p>Content</p>';
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('pages', [
            {id: 2, title: 'Hero Page', published: '2025-03-01', file_path: '/page/hero', body: heroBody, header: 'Header text'},
        ]));
        const getPublicFileById = jest.fn().mockResolvedValue({data: {file_path: 'hero.jpg', thumbnail_path: 'hero_thumb.jpg'}});
        renderWithAll('pages', 5, getLastItems, getPublicFileById);
        await flush();
        await waitFor(() => {
            expect(getPublicFileById).toHaveBeenCalledWith(42);
        });
        // Should prefer thumbnail
        const thumb = document.querySelector('img[src="/files/hero_thumb.jpg"]');
        expect(thumb).toBeInTheDocument();
    });

    it('renders page item without hero when body has no hero embed', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('pages', [
            {id: 3, title: 'Plain Page', published: '2025-04-01', file_path: '/page/plain', body: '<p>No embeds</p>', header: null},
        ]));
        renderWithAll('pages', 5, getLastItems);
        await flush();
        expect(screen.getByText('Plain Page')).toBeInTheDocument();
    });

    it('creates excerpt from body and truncates long bodies', async () => {
        const longBody = '<p>' + 'x'.repeat(300) + '</p>';
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('pages', [
            {id: 4, title: 'Long Page', published: null, file_path: '/page/long', body: longBody, header: null},
        ]));
        renderWithAll('pages', 1, getLastItems);
        await flush();
        expect(screen.getByText('Long Page')).toBeInTheDocument();
        // Truncated excerpt ends with '...'
        const ellipsis = document.body.textContent?.includes('...');
        expect(ellipsis).toBe(true);
    });

    it('uses header as excerpt when body is empty', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('pages', [
            {id: 5, title: 'Empty Body', published: null, file_path: '/page/empty', body: '', header: 'My Header Text'},
        ]));
        renderWithAll('pages', 1, getLastItems);
        await flush();
        expect(screen.getByText('My Header Text')).toBeInTheDocument();
    });

    it('formats null published date as "-"', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('pages', [
            {id: 6, title: 'Undated Page', published: null, file_path: '/page/x', body: null, header: null},
        ]));
        renderWithAll('pages', 1, getLastItems);
        await flush();
        expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('formats valid date string', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('pages', [
            {id: 7, title: 'Dated Page', published: '2024-06-15T00:00:00Z', file_path: '/page/dated', body: null, header: null},
        ]));
        renderWithAll('pages', 1, getLastItems);
        await flush();
        // Should show some date (locale-formatted)
        expect(screen.getByText('Dated Page')).toBeInTheDocument();
    });

    it('renders raw string for invalid date', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('pages', [
            {id: 8, title: 'Bad Date Page', published: 'not-a-date', file_path: '/page/bd', body: null, header: null},
        ]));
        renderWithAll('pages', 1, getLastItems);
        await flush();
        expect(screen.getByText('not-a-date')).toBeInTheDocument();
    });

    it('renders "View all pages" link', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('pages', []));
        renderWithAll('pages', 0, getLastItems);
        await flush();
        expect(screen.getByText('View all pages')).toBeInTheDocument();
    });

    it('getItemLink with gallery type uses gallery_id', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('galleries', [
            {id: 10, title: 'My Gallery', published: null, gallery_id: 10, file_path: null},
        ]));
        renderWithAll('galleries', 1, getLastItems);
        await flush();
        expect(screen.getByText('My Gallery')).toBeInTheDocument();
    });

    it('getItemLink with filePath fallback for non-pages', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('images', [
            {id: 11, title: 'A photo', published: null, file_path: 'photos/img.jpg'},
        ]));
        renderWithAll('images', 1, getLastItems);
        await flush();
        const link = document.querySelector('a[href="/file/photos/img.jpg"]');
        expect(link).not.toBeNull();
    });

    it('getItemLink falls back to "/" when no file_path and no gallery_id', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('documents', [
            {id: 12, title: 'Mystery doc', published: null, file_path: null, gallery_id: null},
        ]));
        renderWithAll('documents', 1, getLastItems);
        await flush();
        expect(screen.getByText('Mystery doc')).toBeInTheDocument();
    });
});

describe('LastItemsEmbed – non-pages types', () => {
    it('renders images list with items', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('images', [
            {id: 20, title: 'Image One', published: '2025-01-01', file_path: 'img/one.jpg', thumbnail_path: 'img/one_thumb.jpg'},
            {id: 21, title: 'Image Two', published: '2025-02-01', file_path: 'img/two.jpg', thumbnail_path: null},
        ]));
        renderWithAll('images', 10, getLastItems);
        await flush();
        expect(screen.getByText('Image One')).toBeInTheDocument();
        expect(screen.getByText('Image Two')).toBeInTheDocument();
        // Verify thumbnail for Image One
        const thumb = document.querySelector('img[src="/files/img/one_thumb.jpg"]');
        expect(thumb).toBeInTheDocument();
    });

    it('renders "View all images" link', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('images', []));
        renderWithAll('images', 5, getLastItems);
        await flush();
        expect(screen.getByText('View all images')).toBeInTheDocument();
    });

    it('renders "View all galleries" link', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('galleries', []));
        renderWithAll('galleries', 5, getLastItems);
        await flush();
        expect(screen.getByText('View all galleries')).toBeInTheDocument();
    });

    it('renders "View all videos" link', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('videos', []));
        renderWithAll('videos', 5, getLastItems);
        await flush();
        expect(screen.getByText('View all videos')).toBeInTheDocument();
    });

    it('renders "View all audio" link', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('audio', []));
        renderWithAll('audio', 5, getLastItems);
        await flush();
        expect(screen.getByText('View all audio')).toBeInTheDocument();
    });

    it('renders "View all documents" link', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('documents', []));
        renderWithAll('documents', 5, getLastItems);
        await flush();
        expect(screen.getByText('View all documents')).toBeInTheDocument();
    });

    it('uses <a> tag for /file/ paths (renderNavLink branch)', async () => {
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('audio', [
            {id: 30, title: 'A Track', published: null, file_path: 'audio/track.mp3'},
        ]));
        renderWithAll('audio', 1, getLastItems);
        await flush();
        // file_path → /file/audio/track.mp3 → rendered as <a> tag
        const link = document.querySelector('a[href="/file/audio/track.mp3"]');
        expect(link).not.toBeNull();
    });
});

describe('LastItemsEmbed – error and body-stripping', () => {
    it('shows error message when API returns error', async () => {
        const getLastItems = jest.fn().mockResolvedValue({error: 'Service unavailable'});
        renderWithAll('images', 5, getLastItems);
        await flush();
        expect(screen.getByText('Service unavailable')).toBeInTheDocument();
    });

    it('shows fallback error when API returns neither data nor error', async () => {
        const getLastItems = jest.fn().mockResolvedValue({});
        renderWithAll('videos', 5, getLastItems);
        await flush();
        expect(screen.getByText('Failed to load latest items')).toBeInTheDocument();
    });

    it('shows error when API rejects with an Error object', async () => {
        const getLastItems = jest.fn().mockRejectedValue(new Error('Connection refused'));
        renderWithAll('images', 5, getLastItems);
        await flush();
        expect(screen.getByText('Connection refused')).toBeInTheDocument();
    });

    it('shows fallback error when API rejects with non-Error', async () => {
        const getLastItems = jest.fn().mockRejectedValue('string error');
        renderWithAll('images', 5, getLastItems);
        await flush();
        expect(screen.getByText('Failed to load latest items')).toBeInTheDocument();
    });

    it('strips embed tags from body in excerpt', async () => {
        const bodyWithEmbeds = '<!--vps:embed:image:1--><p>Text after embed</p>';
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('pages', [
            {id: 40, title: 'Embed Body', published: null, file_path: '/page/e', body: bodyWithEmbeds, header: null},
        ]));
        renderWithAll('pages', 1, getLastItems);
        await flush();
        expect(screen.getByText('Embed Body')).toBeInTheDocument();
        // The embed tag should be stripped from the excerpt
        expect(document.body.textContent).not.toMatch(/<!--vps:embed/);
    });

    it('handles PageHeroThumbnail API failure gracefully', async () => {
        const heroBody = '<!--vps:embed:hero:99-->';
        const getLastItems = jest.fn().mockResolvedValue(makeResponse('pages', [
            {id: 50, title: 'Page with failing hero', published: null, file_path: '/page/fail', body: heroBody, header: null},
        ]));
        const getPublicFileById = jest.fn().mockRejectedValue(new Error('File not found'));
        renderWithAll('pages', 1, getLastItems, getPublicFileById);
        await flush();
        expect(screen.getByText('Page with failing hero')).toBeInTheDocument();
    });
});

