module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended", // Integrates Prettier with ESLint
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": "error",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "no-duplicate-imports": "error",
    "no-var": "error",
    "prefer-const": "error",
  },
};
