import {render, screen} from '@testing-library/react';
import {WordCloudEmbed} from '../../components/WordCloudEmbed';

jest.mock('@ant-design/charts', () => ({
    WordCloud: (props: unknown) => <div data-testid="mock-word-cloud">{JSON.stringify(props)}</div>,
}));

describe('WordCloudEmbed', () => {
    it('renders info alert when data is missing', () => {
        render(<WordCloudEmbed options={{shape: 'circle'}}/>);
        expect(screen.getByText('Word cloud has no tag data')).toBeInTheDocument();
    });

    it('renders chart when valid data is provided', () => {
        render(
            <WordCloudEmbed
                options={{
                    shape: 'diamond',
                    data: [{text: 'nature', value: 14}],
                }}
            />,
        );

        expect(screen.getByTestId('word-cloud-embed')).toBeInTheDocument();
        const config = screen.getByTestId('mock-word-cloud').textContent ?? '';
        expect(config).toContain('"wordField":"text"');
        expect(config).toContain('"weightField":"value"');
        expect(config).toContain('"shape":"diamond"');
        expect(config).toContain('"text":"nature"');
        expect(config).toContain('"value":14');
    });
});
