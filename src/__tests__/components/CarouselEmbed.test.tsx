import {render, screen} from '@testing-library/react';
import {CarouselEmbed} from '../../components/CarouselEmbed';

const twoItems = [
    {title: 'Slide Alpha', body: '<p>Alpha body</p>'},
    {title: 'Slide Beta', body: '<p>Beta body</p>'},
];

describe('CarouselEmbed', () => {
    it('renders slide titles with autoplay=false', () => {
        render(<CarouselEmbed items={twoItems} autoplay={false} dotDuration={false} speed={500}/>);
        expect(screen.getAllByText('Slide Alpha').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Slide Beta').length).toBeGreaterThanOrEqual(1);
    });

    it('renders with autoplay=true and dotDuration=true', () => {
        render(<CarouselEmbed items={twoItems} autoplay={true} dotDuration={true} speed={800}/>);
        expect(screen.getAllByText('Slide Alpha').length).toBeGreaterThanOrEqual(1);
    });

    it('renders with autoplay=true and dotDuration=false', () => {
        render(<CarouselEmbed items={twoItems} autoplay={true} dotDuration={false} speed={600}/>);
        expect(screen.getAllByText('Slide Alpha').length).toBeGreaterThanOrEqual(1);
    });

    it('renders a single item without crashing', () => {
        render(<CarouselEmbed items={[{title: 'Solo', body: 'x'}]} autoplay={false} dotDuration={false} speed={500}/>);
        expect(screen.getAllByText('Solo').length).toBeGreaterThanOrEqual(1);
    });
});

