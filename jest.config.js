/* eslint-disable no-undef */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['node_modules', 'build'],
  moduleNameMapper: {
    'api/(.*)': '<rootDir>/api/$1'
  },
  coveragePathIgnorePatterns: ['<rootDir>/api/test']
}
