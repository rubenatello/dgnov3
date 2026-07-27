module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/generated/**/*", // Ignore generated files.
    ".eslintrc.js", // Ignore this config file itself.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
  },
  overrides: [
    {
      files: ["src/**/*.ts"],
      rules: {
        // TypeScript signatures already describe private helper contracts;
        // reserve JSDoc for exported/public behavior where it adds context.
        "require-jsdoc": "off",
        "valid-jsdoc": "off",
        "max-len": ["error", {"code": 100, "ignoreComments": true}],
      },
    },
    {
      files: ["src/seo.ts"],
      rules: {
        // Crawler HTML/XML templates and the URL-safety character class are
        // clearer when kept intact than when split to satisfy Google style.
        "max-len": "off",
        "no-control-regex": "off",
      },
    },
  ],
};
