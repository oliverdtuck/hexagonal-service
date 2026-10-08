---
description: Adds a new feature module to this hexagonal service, with its core, ports, adapters, tests and wiring. Use when the user wants a new feature area, resource or bounded context, such as "add an orders module".
argument-hint: '[module-name] [what it manages]'
allowed-tools: Bash(npm run typecheck) Bash(npm run lint) Bash(npm run lint:fix) Bash(npm run format) Bash(npm run test:coverage)
---

Add a feature module described by: $ARGUMENTS

If the module's name or purpose is unclear, ask before writing code. Agree the entity, its business rules and the operations it needs.

## Before writing code

1. Read the Architecture, Conventions and Testing sections of `README.md`.
2. Read the `src/tasks/` module in full. It is the reference implementation: copy its structure and idioms, not its domain.

## Build the module

Create `src/<module>/`, mirroring `src/tasks/`:

- `core/domain/<entity>.ts`: the entity type, the functions that enforce its rules (returning `Result`), and the errors those rules produce, each built by a function named after it.
- `core/ports/driving/for-managing-<entities>.ts`: one driving port interface grouping the operations, their `…Command` or `…Query` inputs, `…Error` unions, the view type they return, and use-case outcomes with no domain meaning (such as "not found").
- `core/ports/driven/for-<doing-something>.ts`: one port per external actor the core needs, such as storage.
- `core/application/make-<operation>.ts`: one use case per operation, implementing its function type from the driving port.
- `core/make-<module>.ts`: builds the module's core from its driven adapters and returns the driving port.
- `adapters/driving/http/`: one `make-<operation>-handler.ts` per operation (a Zod schema for the whole request, an exhaustive `ts-pattern` match from error `type` to status), a `make-<module>-router.ts`, and a `to-<entity>-response.ts` mapping the view type to the public JSON shape.
- `adapters/driven/<category>/`: an in-memory implementation of each driven port.

Keep the core free of packages and Node.js built-ins. The boundary rules will reject them.

## Tests

Add tests next to the code, following `src/tasks/`:

- domain rules, including boundary values;
- each use case against the in-memory adapters;
- the router, in `make-<module>-router.test.ts`: one block running the real core with in-memory adapters (each operation end to end, plus its main failures), and one with stubbed use cases mounted through `makeApp` for request validation and each error's status;
- each in-memory adapter's behaviour;

## Wire it up

In `src/main.ts`, build the module with `make<Module>` and its driven adapters, then mount `make<Module>Router(<module>)` in the `routers` passed to `makeApp`.

## Verify

Run `npm run format`, `npm run lint:fix`, `npm run typecheck`, `npm run lint` and `npm run test:coverage`. Fix every failure before reporting back, and don't relax a lint rule or coverage threshold to get there.
