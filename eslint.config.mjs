import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Capacitor copies the built web bundle into the native projects, so
    // linting these just reports thousands of problems in generated vendor
    // code and buries the real findings in our own source.
    "ios/**",
    "android/**",
    "public/sw.js",
  ]),
]);

export default eslintConfig;
