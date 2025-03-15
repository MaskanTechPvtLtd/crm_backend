export default {
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,mjs}', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
    '^.+\\.mjs$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'mjs', 'json', 'node'],
  // testMatch: ['**/tests/**/*.test.[jt]s?(x)'],
  testMatch: ['**/src/tests/**/*.test.[jt]s?(x)'],
  setupFilesAfterEnv: [
    '@testing-library/jest-dom',
    'jest-extended'
  ],
  moduleNameMapper: {
    '^@src/(.*)': '<rootDir>/src/$1',
    '\\.(css|less|scss|svg)$': 'identity-obj-proxy'
  },
  maxWorkers: '50%',
  globalSetup: '<rootDir>/jest/global-setup.js',
  globalTeardown: '<rootDir>/jest/global-teardown.js',
  testTimeout: 30000,
  silent: false,
  // snapshotSerializers: ['<rootDir>/jest/snapshot-serializer.cjs'],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname']
};































// export default {
//   testEnvironment: 'node',
//   clearMocks: true,
//   collectCoverage: true,
//   collectCoverageFrom: ['src/**/*.{js,mjs}', '!src/**/*.d.ts'],
//   coverageDirectory: 'coverage',
//   coverageReporters: ['text', 'lcov', 'json-summary'],
//   transform: {
//     '^.+\\.[tj]sx?$': 'babel-jest',
//     '^.+\\.mjs$': 'babel-jest'
//   },
//   moduleFileExtensions: ['js', 'mjs', 'json', 'node'],
//   testMatch: ['**/tests/**/*.test.[jt]s?(x)'],
//   setupFilesAfterEnv: [
//     '@testing-library/jest-dom',
//     'jest-extended'
//   ],
//   moduleNameMapper: {
//     '^@src/(.*)': '<rootDir>/src/$1',
//     '\\.(css|less|scss|svg)$': 'identity-obj-proxy'
//   },
//   maxWorkers: '50%',
//   globalSetup: '<rootDir>/jest/global-setup.js',
//   globalTeardown: '<rootDir>/jest/global-teardown.js',
//   testTimeout: 30000,
//   silent: false,
//   snapshotSerializers: ['<rootDir>/jest/snapshot-serializer.mjs'],
//   watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
//   // Optional: instruct Jest to treat .mjs as ESM explicitly
//   extensionsToTreatAsEsm: ['.mjs']
// };


















// export default {
//   testEnvironment: 'node',
//   clearMocks: true,
//   collectCoverage: true,
//   collectCoverageFrom: ['src/**/*.{js}', '!src/**/*.d.ts'],
//   coverageDirectory: 'coverage',
//   coverageReporters: ['text', 'lcov', 'json-summary'],
//   transform: {
//     '^.+\\.js$': 'babel-jest'
//   },
//   moduleFileExtensions: ['js', 'json', 'node'],
//   testMatch: ['**/tests/**/*.test.js'],
//   setupFilesAfterEnv: [
//     '@testing-library/jest-dom',
//     'jest-extended'
//   ],
//   moduleNameMapper: {
//     '^@src/(.*)': '<rootDir>/src/$1',
//     '\\.(css|less|scss|svg)$': 'identity-obj-proxy'
//   },
//   maxWorkers: '50%',
//   globalSetup: '<rootDir>/jest/global-setup.js',
//   globalTeardown: '<rootDir>/jest/global-teardown.js',
//   testTimeout: 30000,
//   silent: false,
//   snapshotSerializers: ['<rootDir>/jest/snapshot-serializer.mjs'],
//   watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname']
// };



















// export default {
//   testEnvironment: 'node',
//   clearMocks: true,
//   collectCoverage: true,
//   collectCoverageFrom: ['src/**/*.{js}', '!src/**/*.d.ts'],
//   coverageDirectory: 'coverage',
//   coverageReporters: ['text', 'lcov', 'json-summary'],
//   transform: {
//     '^.+\\.js$': 'babel-jest'
//   },
//   moduleFileExtensions: ['js', 'json', 'node'],
//   testMatch: ['**/tests/**/*.test.js'],
//   setupFilesAfterEnv: [
//     '@testing-library/jest-dom', // Extended assertions for the DOM
//     'jest-extended' // Additional matchers
//   ],
//   moduleNameMapper: {
//     '^@src/(.*)': '<rootDir>/src/$1',
//     '\\.(css|less|scss|svg)$': 'identity-obj-proxy'
//   },
//   maxWorkers: '50%',
//   globalSetup: '<rootDir>/jest/global-setup.js',
//   globalTeardown: '<rootDir>/jest/global-teardown.js',
//   testTimeout: 30000,
//   silent: false,
//   snapshotSerializers: ['<rootDir>/jest/snapshot-serializer.js'],
//   watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname']
// };




















// export default {
//   testEnvironment: 'node',
//   clearMocks: true,
//   collectCoverage: true,
//   collectCoverageFrom: ['src/**/*.{js}', '!src/**/*.d.ts'],
//   coverageDirectory: 'coverage',
//   coverageReporters: ['text', 'lcov', 'json-summary'],
//   transform: {
//     '^.+\\.js$': 'babel-jest'
//   },
//   // Tell Jest to treat .js files as ES modules
//   extensionsToTreatAsEsm: ['.js'],
//   moduleFileExtensions: ['js', 'json', 'node'],
//   testMatch: ['**/tests/**/*.test.js'],
//   setupFilesAfterEnv: [
//     '@testing-library/jest-dom', // Extended assertions for the DOM
//     'jest-extended' // Additional matchers
//   ],
//   moduleNameMapper: {
//     '^@src/(.*)': '<rootDir>/src/$1',
//     '\\.(css|less|scss|svg)$': 'identity-obj-proxy'
//   },
//   maxWorkers: '50%',
//   globalSetup: '<rootDir>/jest/global-setup.js',
//   globalTeardown: '<rootDir>/jest/global-teardown.js',
//   testTimeout: 30000,
//   silent: false,
//   snapshotSerializers: ['<rootDir>/jest/snapshot-serializer.js'],
//   watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname']
// };


























// // jest.config.js
// export default {
//     testEnvironment: 'node',
//     clearMocks: true,
//     collectCoverage: true,
//     collectCoverageFrom: ['src/**/*.{js}', '!src/**/*.d.ts'],
//     coverageDirectory: 'coverage',
//     coverageReporters: ['text', 'lcov', 'json-summary'],
//     transform: {
//       '^.+\\.js$': 'babel-jest',
//     },
//     moduleFileExtensions: ['js', 'json', 'node'],
//     testMatch: ['**/tests/**/*.test.js'],
//     setupFilesAfterEnv: [
//       '@testing-library/jest-dom', // Import jest-dom for extended assertions
//       'jest-extended', // Import jest-extended for additional matchers
//     ],
//     moduleNameMapper: {
//       '^@src/(.*)': '<rootDir>/src/$1',
//       '\\.(css|less|scss|svg)$': 'identity-obj-proxy',
//     },
//     maxWorkers: '50%',
//     globalSetup: '<rootDir>/jest/global-setup.js',
//     globalTeardown: '<rootDir>/jest/global-teardown.js',
//     testTimeout: 30000,
//     silent: false,
//     snapshotSerializers: ['<rootDir>/jest/snapshot-serializer.js'],
//     watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
//   };
  