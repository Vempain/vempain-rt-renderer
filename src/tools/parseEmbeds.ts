import type {EmbedItem, LastEmbedType, PageEmbed} from '../types';

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

export function parseEmbeds(body: string): PageEmbed[] {
    const matchesWithIndex: Array<{ embed: PageEmbed; index: number }> = [];

    const simpleLiteral = /<!--\s*vps:embed:(?<type>gallery|image|hero|video|audio):(?<id>\d+)\s*-->/ig;
    const simpleEncoded = /&lt;!--\s*vps:embed:(?<type>gallery|image|hero|video|audio):(?<id>\d+)\s*--&gt;/ig;

    for (const pattern of [simpleLiteral, simpleEncoded]) {
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(body)) !== null) {
            const type = (m.groups?.type ?? '').toLowerCase();
            const id = Number(m.groups?.id);
            matchesWithIndex.push({
                embed: {type, embed_id: id, placeholder: m[0]},
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

