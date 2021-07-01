module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ["__seed__", "dist"],
  coverageReporters: ['text-summary', 'lcov', 'cobertura']
};