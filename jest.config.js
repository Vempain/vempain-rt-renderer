export default {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    transform: {
        '^.+\\.[tj]sx?$': ['ts-jest', {
            tsconfig: 'tsconfig.jest.json',
            diagnostics: false,
        }],
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(antd|@ant-design/|rc-|@rc-component/|leaflet|react-leaflet|react-player))',
    ],
    moduleNameMapper: {
        '^react-player$': '<rootDir>/__mocks__/react-player.tsx',
    },
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.[jt]s?(x)',
        '<rootDir>/src/**/*.(spec|test).[jt]s?(x)',
    ],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
