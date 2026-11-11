const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/**", "dist-*/**", ".expo/**", "coverage/**", ".npm-cache/**", "node_modules/**"] },
  { rules: { "react-hooks/exhaustive-deps": "warn" } },
]);
