import {Alert, Card, Col, Image, Row, Typography} from 'antd';
import {Link as RouterLink} from 'react-router-dom';
import {useRendererRuntime} from '../runtime/RendererProvider';
import type {TodayRandomEmbedImageItem, TodayRandomEmbedOptions, TodayRandomEmbedPageItem} from '../types';

const {Paragraph, Text, Title} = Typography;

interface TodayRandomEmbedProps {
    options?: TodayRandomEmbedOptions;
}

function normalizeImages(images: unknown): TodayRandomEmbedImageItem[] {
    if (!Array.isArray(images)) {
        return [];
    }

    return images
            .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
            .map((item) => ({
                id: Number(item.id),
                title: typeof item.title === 'string' ? item.title : '',
                file_path: typeof item.file_path === 'string' ? item.file_path : '',
                published: typeof item.published === 'string' ? item.published : null,
            }))
            .filter((item) => Number.isFinite(item.id) && item.id > 0 && item.file_path.trim() !== '');
}

function normalizePages(pages: unknown): TodayRandomEmbedPageItem[] {
    if (!Array.isArray(pages)) {
        return [];
    }

    return pages
            .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
            .map((item) => ({
                id: Number(item.id),
                title: typeof item.title === 'string' ? item.title : '',
                header: typeof item.header === 'string' ? item.header : null,
                file_path: typeof item.file_path === 'string' ? item.file_path : '',
                published: typeof item.published === 'string' ? item.published : null,
            }))
            .filter((item) => Number.isFinite(item.id) && item.id > 0 && item.title.trim() !== '' && item.file_path.trim() !== '');
}

function formatPublished(published: string | null): string {
    if (!published) {
        return '-';
    }

    const parsed = new Date(published);
    if (Number.isNaN(parsed.valueOf())) {
        return published;
    }

    return parsed.toLocaleDateString();
}

export function TodayRandomEmbed({options = {}}: TodayRandomEmbedProps) {
    const {fileAPI, routes} = useRendererRuntime();
    const images = normalizeImages(options.images).slice(0, 5);
    const pages = normalizePages(options.pages).slice(0, 2);

    if (images.length === 0 && pages.length === 0) {
        return <Alert type="info" title="No images or pages found for this date"/>;
    }

    return (
            <div data-testid="today-random-embed" style={{margin: '24px 0'}}>
                {images.length > 0 && (
                        <>
                            <Title level={4}>On this day - images</Title>
                            <Row gutter={[16, 16]}>
                                {images.map((item) => (
                                        <Col key={`today-random-image-${item.id}`} xs={24} sm={12} lg={8} xl={6}>
                                            <Card size="small" title={item.title || 'Image'}>
                                                <Image src={fileAPI.getFileUrl(item.file_path)} alt={item.title || 'Image'}/>
                                                <Text type="secondary">{formatPublished(item.published)}</Text>
                                            </Card>
                                        </Col>
                                ))}
                            </Row>
                        </>
                )}

                {pages.length > 0 && (
                        <>
                            <Title level={4} style={{marginTop: 24}}>On this day - pages</Title>
                            <Row gutter={[16, 16]}>
                                {pages.map((item) => (
                                        <Col key={`today-random-page-${item.id}`} xs={24} md={12}>
                                            <Card size="small" title={<RouterLink to={routes.toFrontendPagePath(item.file_path)}>{item.title}</RouterLink>}>
                                                {item.header && <Paragraph>{item.header}</Paragraph>}
                                                <Text type="secondary">{formatPublished(item.published)}</Text>
                                            </Card>
                                        </Col>
                                ))}
                            </Row>
                        </>
                )}
            </div>
    );
}
