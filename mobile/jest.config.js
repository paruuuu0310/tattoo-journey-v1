module.exports = {
  preset: "react-native",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/ios/",
    "<rootDir>/android/",
  ],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|react-native-vector-icons|@react-native-firebase)/)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/__tests__/**",
    "!src/test-utils/**",
    "!src/test-data/**",
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageDirectory: "coverage",
  testTimeout: 10000,
  verbose: true,
  testEnvironment: "node",
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "identity-obj-proxy",
    "^@react-native-firebase/app$":
      "<rootDir>/src/test-utils/__mocks__/@react-native-firebase/app.js",
    "^@react-native-firebase/(.*)$":
      "<rootDir>/src/test-utils/__mocks__/@react-native-firebase/$1.js",
  },
};
