module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js',
  ],
  moduleNameMapper: {
    '\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/mocks/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  transform: {},
  transformIgnorePatterns: [],
  collectCoverageFrom: [
    'tests/**/*.js',
    '!**/node_modules/**',
  ],
};