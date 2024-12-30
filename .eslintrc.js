module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
    es2021: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    "no-unused-vars": "error",
    "no-console": "off",
    semi: ["error", "always"],
    quotes: ["error", "double"],
  },
};
