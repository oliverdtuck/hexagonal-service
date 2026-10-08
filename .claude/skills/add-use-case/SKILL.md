---
description: Adds a new operation to an existing feature module in this hexagonal service, from domain rule to HTTP route, with tests. Use when the user wants a module to do something new, such as "let tasks be renamed".
argument-hint: '[module] [operation]'
allowed-tools: Bash(npm run typecheck) Bash(npm run lint) Bash(npm run lint:fix) Bash(npm run format) Bash(npm run test:coverage)
---

Add this operation: $ARGUMENTS

If the inputs, rules or failure cases are unclear, ask before writing code.

## Before writing code

1. Read the Architecture and Conventions sections of `README.md`.
2. Read the target module in full, especially its driving port, an existing use case and its handler, and follow their idioms exactly.

## Add the operation, from the inside out

1. **Domain:** if the operation enforces a business rule, add it to the entity's file in `core/domain/` as a function returning `Result`, with any new error defined alongside it. If it repeats an existing rule (for example, validating a field another operation already validates), extract one shared private function so the two can't drift apart.
2. **Driving port:** in `core/ports/driving/`, add the `…Command` or `…Query` input, the `…Error` union, and the function type, then add it to the port's interface. Define use-case outcomes with no domain meaning (such as "not found") in the port file.
3. **Driven ports:** only if the operation needs something the core can't yet ask for. Prefer extending an existing port to adding a new one.
4. **Use case:** `core/application/make-<operation>.ts`, implementing the new function type. Return domain errors directly when the port's error union already names them.
5. **Module wiring:** add the use case to the object returned by `core/make-<module>.ts`.
6. **HTTP adapter:** a `make-<operation>-handler.ts` with a Zod schema for the whole request and an exhaustive `ts-pattern` match from error `type` to status, mapping the result through the module's response mapper. Register the route in the module's router.

## Tests

- New domain rules, including boundary values.
- The use case against the in-memory adapters, covering success and every error.
- The router test, `make-<module>-router.test.ts`: the operation end to end in its real-core block; request validation and each new error's status in its stubbed block. Adding the operation to the driving port makes the stubbed setup fail to type-check until you give it a default stub: add one.

## Verify

Run `npm run format`, `npm run lint:fix`, `npm run typecheck`, `npm run lint` and `npm run test:coverage`. Fix every failure before reporting back, and don't relax a lint rule or coverage threshold to get there.
