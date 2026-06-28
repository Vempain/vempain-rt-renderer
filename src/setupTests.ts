import '@testing-library/jest-dom';
import {TextDecoder, TextEncoder} from 'util';

(globalThis as { TextEncoder?: typeof TextEncoder }).TextEncoder = TextEncoder;
(globalThis as { TextDecoder?: typeof TextDecoder }).TextDecoder = TextDecoder;

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
    }),
});

class ResizeObserverMock {
    observe() {
    }

    unobserve() {
    }

    disconnect() {
    }
}

(globalThis as { ResizeObserver?: typeof ResizeObserverMock }).ResizeObserver = ResizeObserverMock;

const originalGetComputedStyle = window.getComputedStyle.bind(window);
Object.defineProperty(window, 'getComputedStyle', {
    writable: true,
    value: (element: Element, pseudoElt?: string) => originalGetComputedStyle(element, pseudoElt ? undefined : pseudoElt),
});
