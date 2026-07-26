import {Image, Spin} from 'antd';
import {useEffect, useRef, useState} from 'react';
import {useRendererRuntime} from '../runtime/RendererProvider';

interface ImageEmbedProps {
    fileId: number;
}

export function ImageEmbed({fileId}: ImageEmbedProps) {
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
                {src && <Image src={src} style={{maxWidth: '100%', height: 'auto'}} preview={false}/>}
            </Spin>
    );
}

