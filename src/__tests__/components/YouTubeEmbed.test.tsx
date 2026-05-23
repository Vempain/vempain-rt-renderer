import {render, screen} from '@testing-library/react';
import {YouTubeEmbed} from '../../components/YouTubeEmbed';

describe('YouTubeEmbed', () => {
    it('renders the ReactPlayer mock with the provided url', () => {
        render(<YouTubeEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"/>);
        expect(screen.getByTestId('mock-react-player')).toBeInTheDocument();
    });

    it('renders wrapper divs', () => {
        const {container} = render(<YouTubeEmbed url="https://youtu.be/abc"/>);
        const outerDiv = container.querySelector('div');
        expect(outerDiv).toBeTruthy();
    });
});

