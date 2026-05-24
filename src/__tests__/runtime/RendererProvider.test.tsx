import React from 'react';
import {renderHook} from '@testing-library/react';
import {RendererProvider, type RendererRuntime, useRendererRuntime} from '../../runtime/RendererProvider';

const mockRuntime: RendererRuntime = {
    fileAPI: {getFileUrl: (p: string) => `/files/${p}`},
    routes: {toFrontendPagePath: (p: string) => `/pages/${p}`},
    pageAPI: {
        getPublicFileById: jest.fn().mockResolvedValue({data: {file_path: 'x.jpg'}}),
        getLastItems: jest.fn(),
        getMusicData: jest.fn(),
        getGpsOverview: jest.fn(),
        getGpsClusters: jest.fn(),
        getGpsClusterPoints: jest.fn(),
        getGpsTrack: jest.fn(),
    },
};

describe('RendererProvider', () => {
    it('provides runtime via useRendererRuntime', () => {
        const wrapper = ({children}: { children: React.ReactNode }) => (
                <RendererProvider value={mockRuntime}>{children}</RendererProvider>
        );
        const {result} = renderHook(() => useRendererRuntime(), {wrapper});
        expect(result.current.fileAPI.getFileUrl('foo.jpg')).toBe('/files/foo.jpg');
        expect(result.current.routes.toFrontendPagePath('about')).toBe('/pages/about');
    });

    it('throws when useRendererRuntime is called without RendererProvider', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {
        });
        try {
            expect(() => renderHook(() => useRendererRuntime())).toThrow('Renderer runtime missing');
        } finally {
            consoleSpy.mockRestore();
        }
    });
});

