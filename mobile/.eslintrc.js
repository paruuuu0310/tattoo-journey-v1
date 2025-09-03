module.exports = {
  root: true,
  extends: ["@react-native-community", "@react-native/eslint-config"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      rules: {
        "@typescript-eslint/no-shadow": ["error"],
        "no-shadow": "off",
        "no-undef": "off",
      },
    },
  ],
  rules: {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "prettier/prettier": 0,
  },
  ignorePatterns: [
    "node_modules/",
    "android/",
    "ios/",
    "__tests__/",
    "test-execution/",
    "*.js.bak",
    "*.ts.bak",
  ],
};
