import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import astro from "ultracite/oxlint/astro";
import core from "ultracite/oxlint/core";

export default defineConfig({
  extends: [core, astro, antiSlop],
  ignorePatterns: [...(core.ignorePatterns ?? []), "dist/**", ".astro/**", "brand/**"],
  rules: {
    "eslint/sort-keys": "off",
  },
});
