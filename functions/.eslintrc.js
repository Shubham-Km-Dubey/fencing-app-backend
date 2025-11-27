module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "quotes": ["error", "double"],
    // ------------------------------------------------------------------
    // ADD THESE TWO LINES to disable the failing style rules
    "max-len": "off",
    "new-cap": "off",
    // ------------------------------------------------------------------
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
};
