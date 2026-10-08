---
description: Adds a new implementation of a driven port in this hexagonal service, such as a database store replacing the in-memory one, with tests that keep every implementation consistent. Use when the user wants real persistence, an external service or another technology behind an existing port.
argument-hint: '[port] [technology]'
allowed-tools: Bash(npm run typecheck) Bash(npm run lint) Bash(npm run lint:fix) Bash(npm run format) Bash(npm run test:coverage)
---

Add this driven adapter: $ARGUMENTS

Before adding any dependency, confirm the library choice with the user, then read that library's current official documentation and follow it.

## Before writing code

1. Read the Architecture and Conventions sections of `README.md`.
2. Read the driven port being implemented in `core/ports/driven/`, every existing implementation of it, and their tests.

## Share the tests

If this is the port's second implementation, its existing implementation's tests must become a shared suite, so both are held to the same behaviour:

1. Move the existing tests into a function in the adapter category folder (for example `adapters/driven/persistence/`) that takes a factory for the implementation and registers the tests.
2. Call it from each implementation's test file.
3. Add edge cases the existing tests miss, since the real technology may behave differently from the in-memory version.

If a shared suite already exists, run the new implementation against it.

## Build the adapter

- Put it in the same category folder, named `make-<technology>-<thing>.ts`, returning the port's type.
- Take connections or clients as dependencies; don't create global state.
- Keep the port unchanged. If the technology needs something the port can't express, stop and discuss it with the user instead.

## Wire it up

In `src/main.ts`, create the adapter, with any configuration added to `src/load-config.ts`, and pass it to the module instead of the in-memory one. Keep the in-memory adapter for tests.

## Verify

Run `npm run format`, `npm run lint:fix`, `npm run typecheck`, `npm run lint` and `npm run test:coverage`. Fix every failure before reporting back, and don't relax a lint rule or coverage threshold to get there. If the adapter's tests need running infrastructure, say how you ran them, or that you couldn't.
