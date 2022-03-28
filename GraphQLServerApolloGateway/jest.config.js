module.exports = {
    roots: ['<rootDir>/src'],
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.{js,ts}'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testEnvironment: 'node',
    reporters: [
        'default',
        [
            'jest-html-reporters',
            {
                publicPath: './test-report',
                filename: 'index.html',
                expand: true,
            },
        ],
    ]
};
