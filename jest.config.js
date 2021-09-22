module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  'moduleNameMapper': {
    '/opt/nodejs/utils': ['<rootDir>/src/utils/nodejs/utils'],
  },
};
