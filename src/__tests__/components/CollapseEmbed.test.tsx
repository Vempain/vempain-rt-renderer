import {render, screen} from '@testing-library/react';
import {CollapseEmbed} from '../../components/CollapseEmbed';

describe('CollapseEmbed', () => {
    it('renders collapse item titles', () => {
        render(
                <CollapseEmbed
                        items={[
                            {title: 'Section One', body: '<p>Body one</p>'},
                            {title: 'Section Two', body: '<p>Body two</p>'},
                        ]}
                />
        );
        expect(screen.getByText('Section One')).toBeInTheDocument();
        expect(screen.getByText('Section Two')).toBeInTheDocument();
    });

    it('renders a single item', () => {
        render(<CollapseEmbed items={[{title: 'Only', body: '<b>Bold</b>'}]}/>);
        expect(screen.getByText('Only')).toBeInTheDocument();
    });

    it('renders empty list without crashing', () => {
        const {container} = render(<CollapseEmbed items={[]}/>);
        expect(container).toBeTruthy();
    });
});

