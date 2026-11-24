import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import ts from "typescript-eslint";

export default ts.config(
  { ignores: ["**/dist/**", "**/.astro/**"] },
  js.configs.recommended,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        AbortSignal: "readonly",
        console: "readonly",
        fetch: "readonly",
        process: "readonly",
        URL: "readonly",
      },
    },
  },
  {
    files: ["**/*.ts"],
    extends: ts.configs.recommended,
  },
  ...astro.configs.recommended,
);
