import {Spin} from 'antd';
import {useEffect, useRef, useState} from 'react';
import {useRendererRuntime} from '../runtime/RendererProvider';

interface VideoEmbedProps {
    fileId: number;
}

export function VideoEmbed({fileId}: VideoEmbedProps) {
    const {fileAPI, pageAPI} = useRendererRuntime();
    const [src, setSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const activeRef = useRef(true);

    useEffect(() => {
        activeRef.current = true;

        pageAPI.getPublicFileById(fileId)
                .then((response) => {
                    if (!activeRef.current) return;
                    const filePath = response.data?.file_path;
                    if (filePath) {
                        setSrc(fileAPI.getFileUrl(filePath));
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
    }, [fileAPI, fileId, pageAPI]);

    return (
            <Spin spinning={loading}>
                {src && <video src={src} controls style={{maxWidth: '100%', width: '100%', height: 'auto'}}/>}
            </Spin>
    );
}

