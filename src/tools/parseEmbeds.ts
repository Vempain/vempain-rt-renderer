import type {EmbedItem, LastEmbedType, PageEmbed, TodayRandomEmbedOptions, WordCloudEmbedOptions} from '../types';

function tryParseItemsJson(json: string): EmbedItem[] | null {
    try {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed) && parsed.every(
            (item: unknown) =>
                typeof item === 'object' && item !== null &&
                'title' in item && 'body' in item
        )) {
            return parsed as EmbedItem[];
        }

    } catch {
        // Not valid JSON.
    }
    return null;
}

function tryParseWordCloudOptions(json: string): WordCloudEmbedOptions | null {
    try {
        const parsed = JSON.parse(json);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            return parsed as WordCloudEmbedOptions;
        }
    } catch {
        // Not valid JSON.
    }
    return null;
}

function tryParseTodayRandomOptions(json: string): TodayRandomEmbedOptions | null {
    try {
        const parsed = JSON.parse(json);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            return parsed as TodayRandomEmbedOptions;
        }
    } catch {
        // Not valid JSON.
    }
    return null;
}

export function parseEmbeds(body: string): PageEmbed[] {
    const matchesWithIndex: Array<{ embed: PageEmbed; index: number }> = [];

    const typedHeroLiteral = /<!--\s*vps:embed:hero:(?<id>\d+):type:(?<heroType>image|video|carousel)(?::duration:(?<duration>\d+):transition:(?<transition>fade|slide))?\s*-->/ig;
    const typedHeroEncoded = /&lt;!--\s*vps:embed:hero:(?<id>\d+):type:(?<heroType>image|video|carousel)(?::duration:(?<duration>\d+):transition:(?<transition>fade|slide))?\s*--&gt;/ig;
    for (const pattern of [typedHeroLiteral, typedHeroEncoded]) {
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(body)) !== null) {
            matchesWithIndex.push({
                embed: {
                    type: 'hero',
                    embed_id: Number(m.groups?.id),
                    hero_type: (m.groups?.heroType ?? 'image').toLowerCase() as 'image' | 'video' | 'carousel',
                    hero_duration: Number(m.groups?.duration ?? '5') || 5,
                    hero_transition: m.groups?.transition === 'fade' ? 'fade' : 'slide',
                    placeholder: m[0],
                },
                index: m.index,
            });
        }
    }

    const simpleLiteral = /<!--\s*vps:embed:(?<type>gallery|image|hero|video|audio):(?<id>\d+)\s*-->/ig;
    const simpleEncoded = /&lt;!--\s*vps:embed:(?<type>gallery|image|hero|video|audio):(?<id>\d+)\s*--&gt;/ig;

    for (const pattern of [simpleLiteral, simpleEncoded]) {
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(body)) !== null) {
            const type = (m.groups?.type ?? '').toLowerCase();
            const id = Number(m.groups?.id);
            matchesWithIndex.push({
                embed: {type, embed_id: id, ...(type === 'hero' ? {hero_type: 'image' as const} : {}), placeholder: m[0]},
                index: m.index,
            });
        }
    }

    const datasetLiteral = /<!--\s*vps:embed:(?<type>music|gps_timeseries):(?<identifier>[a-z][a-z0-9_]*)\s*-->/ig;
    const datasetEncoded = /&lt;!--\s*vps:embed:(?<type>music|gps_timeseries):(?<identifier>[a-z][a-z0-9_]*)\s*--&gt;/ig;

    for (const pattern of [datasetLiteral, datasetEncoded]) {
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(body)) !== null) {
            const type = (m.groups?.type ?? '').toLowerCase();
            const identifier = (m.groups?.identifier ?? '').trim();
            if (identifier !== '') {
                matchesWithIndex.push({
                    embed: {type, identifier, placeholder: m[0]},
                    index: m.index,
                });
            }
        }
    }

    const wordCloudLiteral = /<!--\s*vps:embed:word_cloud:(?<options>\{[\s\S]*?})\s*-->/ig;
    const wordCloudEncoded = /&lt;!--\s*vps:embed:word_cloud:(?<options>\{[\s\S]*?})\s*--&gt;/ig;

    for (const pattern of [wordCloudLiteral, wordCloudEncoded]) {
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(body)) !== null) {
            const options = tryParseWordCloudOptions(m.groups?.options ?? '');
            if (options !== null) {
                matchesWithIndex.push({
                    embed: {type: 'word_cloud', word_cloud_options: options, placeholder: m[0]},
                    index: m.index,
                });
            }
        }
    }

    const todayRandomLiteral = /<!--\s*vps:embed:today_random:(?<options>\{[\s\S]*?})\s*-->/ig;
    const todayRandomEncoded = /&lt;!--\s*vps:embed:today_random:(?<options>\{[\s\S]*?})\s*--&gt;/ig;

    for (const pattern of [todayRandomLiteral, todayRandomEncoded]) {
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(body)) !== null) {
            const options = tryParseTodayRandomOptions(m.groups?.options ?? '');
            if (options !== null) {
                matchesWithIndex.push({
                    embed: {type: 'today_random', today_random_options: options, placeholder: m[0]},
                    index: m.index,
                });
            }
        }
    }

    const youtubeLiteral = /<!--\s*vps:embed:youtube:(?<url>[\s\S]*?)\s*-->/ig;
    const youtubeEncoded = /&lt;!--\s*vps:embed:youtube:(?<url>[\s\S]*?)\s*--&gt;/ig;

    for (const pattern of [youtubeLiteral, youtubeEncoded]) {
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(body)) !== null) {
            const youtubeUrl = (m.groups?.url ?? '').trim();
            if (youtubeUrl !== '') {
                matchesWithIndex.push({
                    embed: {type: 'youtube', youtube_url: youtubeUrl, placeholder: m[0]},
                    index: m.index,
                });
            }
        }
    }

    const lastLiteral = /<!--\s*vps:embed:last:(?<lastType>pages|galleries|images|videos|audio|documents):(?<count>\d+)\s*-->/ig;
    const lastEncoded = /&lt;!--\s*vps:embed:last:(?<lastType>pages|galleries|images|videos|audio|documents):(?<count>\d+)\s*--&gt;/ig;

    for (const pattern of [lastLiteral, lastEncoded]) {
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(body)) !== null) {
            const lastType = (m.groups?.lastType ?? '').toLowerCase() as LastEmbedType;
            const count = Number(m.groups?.count ?? '0');
            if (count > 0) {
                matchesWithIndex.push({
                    embed: {type: 'last', last_type: lastType, count, placeholder: m[0]},
                    index: m.index,
                });
            }
        }
    }

    const collapseLiteral = /<!--\s*vps:embed:collapse:(\[[\s\S]*?])\s*-->/ig;
    const collapseEncoded = /&lt;!--\s*vps:embed:collapse:(\[[\s\S]*?])\s*--&gt;/ig;

    for (const pattern of [collapseLiteral, collapseEncoded]) {
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(body)) !== null) {
            const items = tryParseItemsJson(m[1]);
            if (items) {
                matchesWithIndex.push({
                    embed: {type: 'collapse', embed_id: 0, placeholder: m[0], items},
                    index: m.index,
                });
            }
        }
    }

    const carouselJsonLiteral = /<!--\s*vps:embed:carousel:(\[[\s\S]*?]):([^:]+):([^:]+):(\d+)\s*-->/ig;
    const carouselJsonEncoded = /&lt;!--\s*vps:embed:carousel:(\[[\s\S]*?]):([^:]+):([^:]+):(\d+)\s*--&gt;/ig;

    for (const pattern of [carouselJsonLiteral, carouselJsonEncoded]) {
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(body)) !== null) {
            const items = tryParseItemsJson(m[1]);
            if (items) {
                matchesWithIndex.push({
                    embed: {
                        type: 'carousel',
                        embed_id: 0,
                        placeholder: m[0],
                        items,
                        autoplay: m[2].toLowerCase() === 'true',
                        dot_duration: m[3].toLowerCase() === 'true',
                        speed: parseInt(m[4], 10) || 500,
                    },
                    index: m.index,
                });
            }
        }
    }

    matchesWithIndex.sort((a, b) => a.index - b.index);

    const seen = new Set<string>();
    const deduped: Array<{ embed: PageEmbed; index: number }> = [];
    for (const entry of matchesWithIndex) {
        const dedupeKey = `${entry.index}:${entry.embed.placeholder ?? ''}`;
        if (!seen.has(dedupeKey)) {
            seen.add(dedupeKey);
            deduped.push(entry);
        }
    }

    return deduped.map(({embed}) => embed);
}
