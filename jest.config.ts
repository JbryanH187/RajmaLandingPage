import type { Config } from 'jest'

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Handle CSS imports (return empty module)
        '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
        // Handle image imports
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
        // Mock zustand middleware
        '^zustand/middleware$': '<rootDir>/__mocks__/zustand/middleware.js',
    },
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.test.json',
            useESM: true,
        }],
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx']
}

export default config
