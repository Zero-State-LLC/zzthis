import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "**/dist/",
    "**/node_modules/",
    "**/.astro/",
    "**/coverage/",
    "**/.wrangler/",
    "public/",
    "workers/api/src/generated/",
    "packages/zz-core/src/generated/",
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      complexity: ["error", 21],
      "max-lines": ["error", 499],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
]);
