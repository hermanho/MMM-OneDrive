import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
  globalIgnores(["./MMM-OneDrive.js", "**/*.d.ts", "./lib/**/*.js"]),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    // ...tseslint.configs.disableTypeChecked,
    ...jsdoc.configs["flat/recommended"],
    ...jsdoc.configs["flat/recommended-typescript-flavor"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },
  {
    files: ["**/*.test.ts", "tests/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "jsdoc/require-jsdoc": "off",
    },
  },
  js.configs.recommended,
  {
    plugins: {
      jsdoc,
      "@stylistic": stylistic,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        Log: true,
        MM: true,
        Module: true,
        moment: true,
        define: true,
        PhotosConverter: true,
      },

      ecmaVersion: 13,
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          globalReturn: true,
        },
      },
    },

    rules: {
      "comma-dangle": ["error", {
        arrays: "always-multiline",
        objects: "always-multiline",
        imports: "always-multiline",
        exports: "always-multiline",
        functions: "only-multiline",
      }],
      eqeqeq: "error",
      "no-prototype-builtins": "off",
      "no-unused-vars": "off",
      "no-useless-return": "error",
      "no-var": "error",
      "jsdoc/require-returns": "off",
      "jsdoc/require-param-description": "off",
      "prefer-const": "error",
      semi: "error",
      "prefer-promise-reject-errors": "off",
      "@typescript-eslint/prefer-promise-reject-errors": "error",
      "require-await": "off",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-unnecessary-template-expression": "error",
      "@stylistic/indent": ["error", 2],
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/newline-per-chained-call": "error",
      "@stylistic/brace-style": "error",
    },
  },
]);