import {WordCloud} from '@ant-design/charts';
import {Alert} from 'antd';
import type {ComponentProps} from 'react';
import type {WordCloudEmbedDataItem, WordCloudEmbedOptions} from '../types';

interface WordCloudEmbedProps {
    options?: WordCloudEmbedOptions;
}

function normalizeData(rawData: unknown): WordCloudEmbedDataItem[] {
    if (!Array.isArray(rawData)) {
        return [];
    }

    return rawData
            .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
            .map((item) => ({
                text: typeof item.text === 'string' ? item.text.trim() : '',
                value: Number(item.value),
            }))
            .filter((item) => item.text !== '' && Number.isFinite(item.value) && item.value > 0);
}

function buildChartConfig(options: WordCloudEmbedOptions, data: WordCloudEmbedDataItem[]): ComponentProps<typeof WordCloud> {
    const rest = {...options};
    delete rest.data;

    return {
        data,
        wordField: 'text',
        weightField: 'value',
        colorField: 'text',
        fontSize: [14, 56],
        autoFit: true,
        ...rest,
    } as ComponentProps<typeof WordCloud>;
}

export function WordCloudEmbed({options = {}}: WordCloudEmbedProps) {
    const data = normalizeData(options.data);
    if (data.length === 0) {
        return <Alert type="info" title="Word cloud has no tag data"/>;
    }

    const config = buildChartConfig(options, data);

    return (
            <div data-testid="word-cloud-embed" style={{margin: '24px 0'}}>
                <WordCloud {...config} />
            </div>
    );
}
