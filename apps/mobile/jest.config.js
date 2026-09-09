module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
