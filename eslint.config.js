// @ts-check

import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { createConfig, strict } from 'eslint-plugin-boundaries/config';
import perfectionist from 'eslint-plugin-perfectionist';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

const sameModule = '{{ from.element.captured.module }}';

export default defineConfig(
  globalIgnores(['coverage', 'dist']),
  {
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      perfectionist.configs['recommended-natural'],
    ],
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js'],
        },
      },
    },
    rules: {
      // Function properties get strict parameter checks; method signatures don't
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/prefer-destructuring': 'error',
      'func-style': ['error', 'expression'],
      'no-duplicate-imports': 'error',
      'object-shorthand': 'error',
    },
  },
  createConfig({
    files: ['src/**/*.ts'],
    rules: {
      ...strict.rules,
      'boundaries/dependencies': [
        'error',
        {
          checkAllOrigins: true,
          // So imports of test files are caught within an element too
          checkInternals: true,
          // App files are known by category, not by element
          checkUnknownLocals: true,
          default: 'disallow',
          policies: [
            { allow: { dependency: { relationship: { to: 'internal' } } } },
            { allow: { to: { module: { origin: ['core', 'external'] } } } },
            { allow: { to: { element: { type: 'lib' } } } },
            // 1. The core (the hexagon) stays free of frameworks and platform APIs
            {
              disallow: { to: { module: { origin: ['core', 'external'] } } },
              from: {
                element: {
                  types: [
                    'application',
                    'core',
                    'domain',
                    'driven-ports',
                    'driving-ports',
                  ],
                },
              },
            },
            // 3. Ports speak the domain's language and never depend on application code
            {
              allow: {
                to: {
                  element: { captured: { module: sameModule }, type: 'domain' },
                },
              },
              from: { element: { types: ['driven-ports', 'driving-ports'] } },
            },
            // 4. Use cases implement driving ports and call driven ports
            {
              allow: {
                to: {
                  element: {
                    captured: { module: sameModule },
                    types: ['domain', 'driven-ports', 'driving-ports'],
                  },
                },
              },
              from: { element: { type: 'application' } },
            },
            // The module's wiring builds the hexagon from its own use cases and ports
            {
              allow: {
                to: {
                  element: {
                    captured: { module: sameModule },
                    types: ['application', 'driven-ports', 'driving-ports'],
                  },
                },
              },
              from: { element: { type: 'core' } },
            },
            // 5. Each adapter talks only to its own side's ports
            {
              allow: {
                to: {
                  element: {
                    captured: { module: sameModule },
                    type: 'driving-ports',
                  },
                },
              },
              from: { element: { type: 'driving-adapters' } },
            },
            {
              allow: {
                to: {
                  element: {
                    captured: { module: sameModule },
                    types: ['domain', 'driven-ports'],
                  },
                },
              },
              from: { element: { type: 'driven-adapters' } },
            },
            // 7. The configurator wires everything together
            {
              allow: { to: { module: { origin: 'local' } } },
              from: { file: { categories: 'app' } },
            },
            // 8. Production code never imports test code...
            { disallow: { to: { file: { categories: 'test' } } } },
            // ...while tests may use test packages, their own module, other tests and the HTTP host
            {
              allow: {
                to: [
                  {
                    module: {
                      origin: 'external',
                      source: ['supertest', 'vitest'],
                    },
                  },
                  { element: { captured: { module: sameModule } } },
                  { element: { type: 'http' } },
                  { file: { categories: 'test' } },
                ],
              },
              from: { file: { categories: 'test' } },
            },
          ],
        },
      ],
    },
    settings: {
      'boundaries/elements': [
        { partialMatch: false, pattern: 'src/http', type: 'http' },
        { partialMatch: false, pattern: 'src/lib', type: 'lib' },
        {
          capture: ['module'],
          partialMatch: false,
          pattern: 'src/*/adapters/driven',
          type: 'driven-adapters',
        },
        {
          capture: ['module'],
          partialMatch: false,
          pattern: 'src/*/adapters/driving',
          type: 'driving-adapters',
        },
        {
          capture: ['module'],
          partialMatch: false,
          pattern: 'src/*/core/application',
          type: 'application',
        },
        {
          capture: ['module'],
          partialMatch: false,
          pattern: 'src/*/core/domain',
          type: 'domain',
        },
        {
          capture: ['module'],
          partialMatch: false,
          pattern: 'src/*/core/ports/driven',
          type: 'driven-ports',
        },
        {
          capture: ['module'],
          partialMatch: false,
          pattern: 'src/*/core/ports/driving',
          type: 'driving-ports',
        },
        {
          capture: ['module'],
          partialMatch: false,
          pattern: 'src/*/core',
          type: 'core',
        },
      ],
      'boundaries/files': [
        // main.ts and load-config.ts are the configurator
        { category: 'app', pattern: 'src/*.ts' },
        { category: 'test', pattern: 'src/**/*.test.ts' },
      ],
      'boundaries/legacy-templates': false,
      'boundaries/root-path': import.meta.dirname,
    },
  }),
  eslintConfigPrettier,
);
