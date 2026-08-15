import {Alert, Carousel, Spin} from 'antd';
import {useEffect, useRef, useState} from 'react';
import {useRendererRuntime} from '../runtime/RendererProvider';
import type {HeroTransition, RendererGalleryFile} from '../types';

interface HeroEmbedProps {
    fileId: number;
    title: string;
    heroType?: 'image' | 'video' | 'carousel';
    duration?: number;
    transition?: HeroTransition;
}

export function HeroEmbed({
                              fileId,
                              title,
                              heroType = 'image',
                              duration = 5,
                              transition = 'slide',
                          }: HeroEmbedProps) {
    const {fileAPI, pageAPI} = useRendererRuntime();
    const [src, setSrc] = useState<string | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<RendererGalleryFile[]>([]);
    const [activeSlide, setActiveSlide] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const activeRef = useRef(true);

    useEffect(() => {
        activeRef.current = true;
        setError(null);
        setActiveSlide(0);
        const request = heroType === 'carousel'
                ? pageAPI.getPublicGalleryFiles?.(fileId, {page: 0, size: 100})
                : pageAPI.getPublicFileById(fileId);
        if (!request) {
            setError('Gallery media API is not configured.');
            setLoading(false);
            return;
        }
        request
                .then((response) => {
                    if (!activeRef.current) return;
                    if (heroType === 'carousel') {
                        const files = response.data && 'content' in response.data ? response.data.content : [];
                        setGalleryFiles(files);
                    } else {
                        const filePath = response.data && 'file_path' in response.data ? response.data.file_path : null;
                        if (filePath) setSrc(fileAPI.getFileUrl(filePath));
                    }
                })
                .catch(() => {
                    if (!activeRef.current) return;
                    setSrc(null);
                })
                .finally(() => {
                    if (activeRef.current) {
                        setLoading(false);
                    }
                });

        return () => {
            activeRef.current = false;
        };
    }, [fileAPI, fileId, heroType, pageAPI]);

    if (heroType === 'carousel') {
        if (error) return <Alert type="error" title={error}/>;
        return (
                <div style={{width: '100%', minWidth: 0, overflow: 'hidden'}}>
                    <Spin spinning={loading}>
                        <Carousel autoplay pauseOnHover={false} autoplaySpeed={duration * 1000}
                                  beforeChange={(_, next) => setActiveSlide(next)}
                                  effect={transition === 'fade' ? 'fade' : 'scrollx'}>
                            {galleryFiles.map((file, index) => (
                                    <div key={file.id} style={{position: 'relative', width: '100%', minWidth: 0}}>
                                        {index === activeSlide && (file.mimetype.startsWith('video/')
                                                ? <video src={fileAPI.getFileUrl(file.file_path)} controls
                                                         style={{width: '100%', height: 'auto', display: 'block'}}/>
                                                : <img src={fileAPI.getFileUrl(file.file_path)} alt={title}
                                                       style={{width: '100%', height: 'auto', display: 'block'}}/>)}
                                        {index === activeSlide && <HeroTitle title={title}/>}
                                    </div>
                            ))}
                        </Carousel>
                    </Spin>
                </div>
        );
    }

    return (
            <Spin spinning={loading}>
                {src && (
                        <div style={{position: 'relative', width: '100%'}}>
                            {heroType === 'video'
                                    ? <video src={src} controls style={{width: '100%', height: 'auto', display: 'block'}}/>
                                    : <img src={src} alt={title} style={{width: '100%', height: 'auto', display: 'block'}}/>}
                            <HeroTitle title={title}/>
                        </div>
                )}
            </Spin>
    );
}

function HeroTitle({title}: { title: string }) {
    return (
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <h1 style={{color: '#fff', margin: 0, textAlign: 'center', padding: '0 16px'}}>{title}</h1>
            </div>
    );
}
