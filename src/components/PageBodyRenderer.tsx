import {Alert} from 'antd';
import React, {lazy, Suspense} from 'react';
import {parseEmbeds} from '../tools/parseEmbeds';
import {AudioEmbed} from './AudioEmbed';
import {CarouselEmbed} from './CarouselEmbed';
import {CollapseEmbed} from './CollapseEmbed';
import {HeroEmbed} from './HeroEmbed';
import {ImageEmbed} from './ImageEmbed';
import {LastItemsEmbed} from './LastItemsEmbed';
import {MusicDataEmbed} from './MusicDataEmbed';
import {TodayRandomEmbed} from './TodayRandomEmbed';
import {VideoEmbed} from './VideoEmbed';
import {WordCloudEmbed} from './WordCloudEmbed';
import {YouTubeEmbed} from './YouTubeEmbed';

const LazyGpsTimeSeriesEmbed = lazy(() => import('./GpsTimeSeriesEmbed'));

interface PageBodyRendererProps {
    body: string;
    pageTitle?: string;
    renderGallery?: (galleryId: number, index: number) => React.ReactNode;
}

export function PageBodyRenderer({body, pageTitle = '', renderGallery}: PageBodyRendererProps) {
    if (!body) return null;

    const resolvedEmbeds = parseEmbeds(body);

    if (!resolvedEmbeds || resolvedEmbeds.length === 0) {
        return <div dangerouslySetInnerHTML={{__html: body}}/>;
    }

    const segments: React.ReactNode[] = [];
    let cursor = 0;

    resolvedEmbeds.forEach((embed, index) => {
        const placeholder = embed.placeholder ?? `<!--vps:embed:${embed.type}:${embed.embed_id}-->`;
        const placeholderIndex = body.indexOf(placeholder, cursor);

        if (placeholderIndex === -1) {
            return;
        }

        const beforeHtml = body.slice(cursor, placeholderIndex);
        if (beforeHtml.trim()) {
            segments.push(<div key={`html-${index}`} dangerouslySetInnerHTML={{__html: beforeHtml}}/>);
        }

        if (embed.type === 'gallery' && embed.embed_id) {
            if (renderGallery) {
                segments.push(<React.Fragment
                    key={`gallery-${embed.embed_id}-${index}`}>{renderGallery(embed.embed_id, index)}</React.Fragment>);
            } else {
                segments.push(<Alert key={`gallery-missing-${embed.embed_id}-${index}`} type="info"
                                     title={`Gallery ${embed.embed_id} renderer missing`}/>);
            }
        } else if (embed.type === 'image' && embed.embed_id) {
            segments.push(<ImageEmbed key={`image-${embed.embed_id}-${index}`} fileId={embed.embed_id}/>);
        } else if (embed.type === 'hero' && embed.embed_id) {
            segments.push(<HeroEmbed key={`hero-${embed.embed_id}-${index}`} fileId={embed.embed_id}
                                     title={pageTitle}/>);
        } else if (embed.type === 'video' && embed.embed_id) {
            segments.push(<VideoEmbed key={`video-${embed.embed_id}-${index}`} fileId={embed.embed_id}/>);
        } else if (embed.type === 'audio' && embed.embed_id) {
            segments.push(<AudioEmbed key={`audio-${embed.embed_id}-${index}`} fileId={embed.embed_id}/>);
        } else if (embed.type === 'youtube' && embed.youtube_url) {
            segments.push(<YouTubeEmbed key={`youtube-${index}`} url={embed.youtube_url}/>);
        } else if (embed.type === 'music' && embed.identifier) {
            segments.push(<MusicDataEmbed key={`music-${embed.identifier}-${index}`} identifier={embed.identifier}/>);
        } else if (embed.type === 'word_cloud' && embed.word_cloud_options) {
            segments.push(<WordCloudEmbed key={`word-cloud-${index}`} options={embed.word_cloud_options}/>);
        } else if (embed.type === 'today_random' && embed.today_random_options) {
            segments.push(<TodayRandomEmbed key={`today-random-${index}`} options={embed.today_random_options}/>);
        } else if (embed.type === 'gps_timeseries' && embed.identifier) {
            segments.push(
                <Suspense key={`gps-${embed.identifier}-${index}`} fallback={<div>Loading GPS map...</div>}>
                    <LazyGpsTimeSeriesEmbed identifier={embed.identifier}/>
                </Suspense>
            );
        } else if (embed.type === 'last' && embed.last_type && embed.count) {
            segments.push(<LastItemsEmbed key={`last-${embed.last_type}-${index}`} lastType={embed.last_type}
                                          count={embed.count}/>);
        } else if (embed.type === 'collapse' && embed.items) {
            segments.push(<CollapseEmbed key={`collapse-${index}`} items={embed.items}/>);
        } else if (embed.type === 'carousel' && embed.items) {
            segments.push(
                <CarouselEmbed
                    key={`carousel-${index}`}
                    items={embed.items}
                    autoplay={embed.autoplay ?? false}
                    dotDuration={embed.dot_duration ?? false}
                    speed={embed.speed ?? 500}
                />
            );
        }

        cursor = placeholderIndex + placeholder.length;
    });

    const tail = body.slice(cursor);
    if (tail.trim()) {
        segments.push(<div key="html-tail" dangerouslySetInnerHTML={{__html: tail}}/>);
    }

    return <>{segments}</>;
}
