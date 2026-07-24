import {createContext, useContext} from 'react';
import type {
    ApiResponse,
    GpsClusterPointsResponse,
    GpsClustersResponse,
    GpsOverviewResponse,
    GpsTrackResponse,
    LastEmbedType,
    LastItemsResponse,
    MusicDataResponse,
} from '../types';

export interface RendererPageApi {
    getPublicFileById(id: number): Promise<ApiResponse<{ file_path?: string | null; thumbnail_path?: string | null }>>;

    getLastItems(type: LastEmbedType, count: number): Promise<ApiResponse<LastItemsResponse>>;

    getMusicData(identifier: string, params: {
        page?: number;
        perPage?: number;
        sortBy?: string;
        direction?: 'asc' | 'desc';
        search?: string;
    }): Promise<ApiResponse<MusicDataResponse>>;

    getGpsOverview(identifier: string): Promise<ApiResponse<GpsOverviewResponse>>;

    getGpsClusters(identifier: string, params: {
        zoom: number;
        minLat?: number;
        maxLat?: number;
        minLng?: number;
        maxLng?: number;
    }): Promise<ApiResponse<GpsClustersResponse>>;

    getGpsClusterPoints(identifier: string, clusterKey: string, limit?: number): Promise<ApiResponse<GpsClusterPointsResponse>>;

    getGpsTrack(identifier: string, maxPoints?: number): Promise<ApiResponse<GpsTrackResponse>>;
}

export interface RendererFileApi {
    getFileUrl(filePath: string): string;
}

export interface RendererRoutes {
    toFrontendPagePath(filePath: string): string;
}

export interface RendererRuntime {
    pageAPI: RendererPageApi;
    fileAPI: RendererFileApi;
    routes: RendererRoutes;
}

const RendererRuntimeContext = createContext<RendererRuntime | null>(null);

export function RendererProvider({value, children}: { value: RendererRuntime; children: React.ReactNode }) {
    return <RendererRuntimeContext.Provider value={value}>{children}</RendererRuntimeContext.Provider>;
}

export function useRendererRuntime(): RendererRuntime {
    const runtime = useContext(RendererRuntimeContext);
    if (!runtime) {
        throw new Error('Renderer runtime missing. Wrap app with <RendererProvider>.');
    }
    return runtime;
}

