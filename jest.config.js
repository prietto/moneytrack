/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/android/', '<rootDir>/ios/', '<rootDir>/drizzle/'],
  moduleNameMapper: {
    // Mismo orden que los paths de tsconfig.json: el más específico primero.
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
